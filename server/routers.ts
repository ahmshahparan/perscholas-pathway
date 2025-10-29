import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { verifyAdminCredentials, generateAdminToken, verifyAdminToken, getUsernameFromToken } from "./adminAuth";
import { assertCanModify } from "./authorization";
import { getDb } from "./db";
import { courseJobRoles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  getAllCourses,
  getCourseById,
  getCourseByCourseId,
  checkDuplicateCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getPrerequisites,
  getNextSteps,
  checkDuplicatePathway,
  createPathway,
  updatePathway,
  deletePathway,
  getAllPathways,
  getAllDomains,
  createDomain,
  updateDomain,
  deleteDomain,
  createAuditLog,
  getAuditLogsByEntity,
  getAllAuditLogs,
  getAllAdminUsers,
  getAdminById,
  getAdminByUsername,
  createAdminUser,
  updateAdminUser,
  updateAdminPassword,
  createPasswordResetToken,
  getPasswordResetToken,
  markTokenAsUsed,
  getJobRolesForCourse,
  getAllJobRoles,
  addJobRolesToCourse,
  createJobRole,
  updateJobRole,
  deleteJobRole,
  checkDuplicateJobRole,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  // OAuth removed - using admin_users authentication only

  // Admin authentication
  admin: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        const { username, password } = input;
        const isValid = await verifyAdminCredentials(username, password);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        // Get admin user to retrieve role
        const admin = await getAdminByUsername(username);
        if (!admin) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin user not found" });
        }
        const token = generateAdminToken(username);
        return { token, username, role: admin.role };
      }),
    verify: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(({ input }) => {
        const payload = verifyAdminToken(input.token);
        return { username: payload.username };
      }),
  }),

  // Public course browsing
  courses: router({
    list: publicProcedure.query(async () => {
      const allCourses = await getAllCourses();
      // Calculate next steps count and job roles for each course
      const coursesWithData = await Promise.all(
        allCourses.map(async (course) => {
          const nextSteps = await getNextSteps(course.id);
          const jobRoles = await getJobRolesForCourse(course.id);
          return {
            ...course,
            nextStepsCount: nextSteps.length,
            jobRoles,
          };
        })
      );
      return coursesWithData;
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const course = await getCourseById(input.id);
        if (!course) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
        }
        const prerequisites = await getPrerequisites(input.id);
        const nextSteps = await getNextSteps(input.id);
        const jobRoles = await getJobRolesForCourse(input.id);
        return { course, prerequisites, nextSteps, jobRoles };
      }),
    getByCourseId: publicProcedure
      .input(z.object({ courseId: z.string() }))
      .query(async ({ input }) => {
        const course = await getCourseByCourseId(input.courseId);
        if (!course) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
        }
        const prerequisites = await getPrerequisites(course.id);
        const nextSteps = await getNextSteps(course.id);
        const jobRoles = await getJobRolesForCourse(course.id);
        return { course, prerequisites, nextSteps, jobRoles };
      }),
  }),

  // Admin course management
  adminCourses: router({
    checkDuplicate: publicProcedure
      .input(
        z.object({
          token: z.string(),
          courseName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        verifyAdminToken(input.token);
        const duplicate = await checkDuplicateCourse(input.courseName);
        return { isDuplicate: !!duplicate, course: duplicate };
      }),
    create: publicProcedure
      .input(
        z.object({
          token: z.string(),
          courseName: z.string(),
          courseType: z.enum(["immersive", "skill_based", "exam_cert", "completion_cert", "paid"]),
          domainId: z.number(),
          courseObjectives: z.string(),
          weeks: z.number(),
          certificationsBadges: z.string().optional(),
          jobRoleIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        const { token, jobRoleIds, ...courseData } = input;
        const result = await createCourse({ ...courseData, createdBy: username });
        
        // Add job roles if provided
        if (jobRoleIds && jobRoleIds.length > 0) {
          await addJobRolesToCourse(result.id, jobRoleIds);
        }
        
        // Log the action
        await createAuditLog({
          adminUsername: username,
          action: "create",
          entityType: "course",
          entityId: result.id,
          entityName: courseData.courseName,
          changeDescription: `Created course "${courseData.courseName}" (${courseData.courseType}, ${courseData.weeks} weeks)`,
        });
        
        return { insertId: result.id };
      }),
    update: publicProcedure
      .input(
        z.object({
          token: z.string(),
          id: z.number(),
          courseName: z.string().optional(),
          courseType: z.enum(["immersive", "skill_based", "exam_cert", "completion_cert", "paid"]).optional(),
          courseObjectives: z.string().optional(),
          weeks: z.number().optional(),
          certificationsBadges: z.string().optional(),
          jobRoleIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        const { token, id, jobRoleIds, ...courseData } = input;
        
        // Get old course data for comparison and authorization check
        const oldCourse = await getCourseById(id);
        if (!oldCourse) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
        }
        
        // Check authorization
        assertCanModify(username, oldCourse.createdBy, "course", oldCourse.courseName);
        
        await updateCourse(id, courseData);
        
        // Update job roles if provided
        if (jobRoleIds !== undefined) {
          // First, delete existing job role associations
          const db = await getDb();
          if (db) {
            await db.delete(courseJobRoles).where(eq(courseJobRoles.courseId, id));
            
            // Then add new job roles
            if (jobRoleIds.length > 0) {
              await addJobRolesToCourse(id, jobRoleIds);
            }
          }
        }
        
        // Build change description
        const changes: string[] = [];
        if (oldCourse) {
          if (courseData.courseName && courseData.courseName !== oldCourse.courseName) {
            changes.push(`name: "${oldCourse.courseName}" → "${courseData.courseName}"`);
          }
          if (courseData.weeks && courseData.weeks !== oldCourse.weeks) {
            changes.push(`weeks: ${oldCourse.weeks} → ${courseData.weeks}`);
          }
          if (courseData.courseType && courseData.courseType !== oldCourse.courseType) {
            changes.push(`type: ${oldCourse.courseType} → ${courseData.courseType}`);
          }
        }
        
        await createAuditLog({
          adminUsername: username,
          action: "update",
          entityType: "course",
          entityId: id,
          entityName: courseData.courseName || oldCourse?.courseName || "Unknown",
          changeDescription: `Updated course: ${changes.join(", ")}`,
        });
        
        return { success: true };
      }),
    getDeleteImpact: publicProcedure
      .input(z.object({ token: z.string(), id: z.number() }))
      .query(async ({ input }) => {
        verifyAdminToken(input.token);
        const course = await getCourseById(input.id);
        if (!course) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
        }
        
        // Find all pathways using this course
        const allPathways = await getAllPathways();
        const pathwaysUsingCourse = allPathways.filter(
          p => p.prerequisiteCourseId === input.id || p.nextCourseId === input.id
        );
        
        // Find courses that would be orphaned
        const orphanedCourses: any[] = [];
        for (const pathway of pathwaysUsingCourse) {
          if (pathway.prerequisiteCourseId === input.id) {
            // Check if the next course has other incoming pathways
            const otherIncoming = allPathways.filter(
              p => p.nextCourseId === pathway.nextCourseId && p.id !== pathway.id
            );
            
            if (otherIncoming.length === 0) {
              const nextCourse = await getCourseById(pathway.nextCourseId);
              if (nextCourse && nextCourse.courseType !== 'immersive') {
                orphanedCourses.push(nextCourse);
              }
            }
          }
        }
        
        const pathwayDescriptions = await Promise.all(
          pathwaysUsingCourse.map(async (pathway) => {
            const prereq = await getCourseById(pathway.prerequisiteCourseId);
            const next = await getCourseById(pathway.nextCourseId);
            return {
              id: pathway.id,
              description: `"${prereq?.courseName}" → "${next?.courseName}"`,
              prerequisite: prereq,
              next: next
            };
          })
        );
        
        return {
          canDelete: pathwaysUsingCourse.length === 0,
          affectedPathways: pathwayDescriptions,
          orphanedCourses,
          requiresCascade: pathwaysUsingCourse.length > 0
        };
      }),
    delete: publicProcedure
      .input(z.object({ 
        token: z.string(), 
        id: z.number(),
        cascade: z.boolean().optional().default(false)
      }))
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        const course = await getCourseById(input.id);
        if (!course) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
        }
        
        // Check authorization
        assertCanModify(username, course.createdBy, "course", course.courseName);
        
        // Check if course is used in any pathways
        const allPathways = await getAllPathways();
        const pathwaysUsingCourse = allPathways.filter(
          p => p.prerequisiteCourseId === input.id || p.nextCourseId === input.id
        );
        
        if (pathwaysUsingCourse.length > 0) {
          // If cascade is not enabled, block deletion
          if (!input.cascade) {
            const pathwayDescriptions = await Promise.all(
              pathwaysUsingCourse.map(async (pathway) => {
                const prereq = await getCourseById(pathway.prerequisiteCourseId);
                const next = await getCourseById(pathway.nextCourseId);
                return `"${prereq?.courseName}" → "${next?.courseName}"`;
              })
            );
            
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: `Cannot delete course "${course.courseName}": It is used in ${pathwaysUsingCourse.length} pathway(s): ${pathwayDescriptions.join(", ")}. Enable cascade delete to remove these pathways automatically, or remove them manually first.`
            });
          }
          
          // Cascade delete: Remove all pathways using this course
          for (const pathway of pathwaysUsingCourse) {
            await deletePathway(pathway.id);
            
            const prereq = await getCourseById(pathway.prerequisiteCourseId);
            const next = await getCourseById(pathway.nextCourseId);
            
            await createAuditLog({
              adminUsername: username,
              action: "delete",
              entityType: "pathway",
              entityId: pathway.id,
              entityName: `${prereq?.courseName} → ${next?.courseName}`,
              changeDescription: `Deleted pathway (cascade from course deletion): ${prereq?.courseName} → ${next?.courseName}`,
            });
          }
        }
        
        await deleteCourse(input.id);
        
        await createAuditLog({
          adminUsername: username,
          action: "delete",
          entityType: "course",
          entityId: input.id,
          entityName: course?.courseName || "Unknown",
          changeDescription: `Deleted course "${course?.courseName}"`,
        });
        
        return { success: true };
      }),
  }),

  // Public pathway viewing
  pathways: router({  
    list: publicProcedure.query(async () => {
      return await getAllPathways();
    }),
  }),

  // Domains (public read, admin write)
  domains: router({
    list: publicProcedure.query(async () => {
      return await getAllDomains();
    }),
  }),

  // Job Roles (public read)
  jobRoles: router({
    list: publicProcedure.query(async () => {
      return await getAllJobRoles();
    }),
  }),

  // Admin job roles management
  adminJobRoles: router({
    create: publicProcedure
      .input(
        z.object({
          token: z.string(),
          title: z.string().min(1, "Title is required"),
          description: z.string().optional(),
          salaryRange: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        // Job roles don't have individual creators, only admin-global can manage
        if (username !== "admin-global") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admin-global can manage job roles",
          });
        }

        // Check for duplicate
        const isDuplicate = await checkDuplicateJobRole(input.title);
        if (isDuplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A job role with this title already exists",
          });
        }

        const result = await createJobRole({
          title: input.title,
          description: input.description,
          salaryRange: input.salaryRange,
        });

        const insertId = result[0].id;

        await createAuditLog({
          entityType: "job_role",
          entityId: insertId,
          action: "create",
          adminUsername: username,
          entityName: input.title,
          changeDescription: `Created job role: ${input.title}`,
        });

        return { success: true, id: insertId };
      }),

    update: publicProcedure
      .input(
        z.object({
          token: z.string(),
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          salaryRange: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        // Job roles don't have individual creators, only admin-global can manage
        if (username !== "admin-global") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admin-global can manage job roles",
          });
        }

        // Check for duplicate if title is being updated
        if (input.title) {
          const isDuplicate = await checkDuplicateJobRole(input.title, input.id);
          if (isDuplicate) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A job role with this title already exists",
            });
          }
        }

        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.salaryRange !== undefined) updateData.salaryRange = input.salaryRange;

        await updateJobRole(input.id, updateData);

        await createAuditLog({
          entityType: "job_role",
          entityId: input.id,
          action: "update",
          adminUsername: username,
          entityName: input.title || `Job Role ${input.id}`,
          changeDescription: `Updated job role ID ${input.id}`,
        });

        return { success: true };
      }),

    delete: publicProcedure
      .input(
        z.object({
          token: z.string(),
          id: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        // Job roles don't have individual creators, only admin-global can manage
        if (username !== "admin-global") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admin-global can manage job roles",
          });
        }

        await deleteJobRole(input.id);

        await createAuditLog({
          entityType: "job_role",
          entityId: input.id,
          action: "delete",
          adminUsername: username,
          entityName: `Job Role ${input.id}`,
          changeDescription: `Deleted job role ID ${input.id}`,
        });

        return { success: true };
      }),
  }),

  // Admin domain management
  adminDomains: router({
    create: publicProcedure
      .input(
        z.object({
          token: z.string(),
          name: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        const { token, ...domainData } = input;
        await createDomain({ ...domainData, createdBy: username });
        return { success: true };
      }),
    update: publicProcedure
      .input(
        z.object({
          token: z.string(),
          id: z.number(),
          name: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        const { token, id, ...domainData } = input;
        
        // Get domain info for authorization check
        const domains = await getAllDomains();
        const domain = domains.find(d => d.id === id);
        if (!domain) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
        }
        
        // Check authorization
        assertCanModify(username, domain.createdBy, "domain", domain.name);
        
        await updateDomain(id, domainData);
        return { success: true };
      }),
    delete: publicProcedure
      .input(
        z.object({
          token: z.string(),
          id: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        
        // Get domain info before delete
        const domains = await getAllDomains();
        const domain = domains.find(d => d.id === input.id);
        if (!domain) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found" });
        }
        
        // Check authorization
        assertCanModify(username, domain.createdBy, "domain", domain.name);
        
        await deleteDomain(input.id);
        
        await createAuditLog({
          adminUsername: username,
          action: "delete",
          entityType: "domain",
          entityId: input.id,
          entityName: domain?.name || "Unknown",
          changeDescription: `Deleted domain "${domain?.name}"`,
        });
        
        return { success: true };
      }),
  }),

  // Audit logs
  auditLogs: router({
    getAll: publicProcedure
      .input(z.object({ token: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        verifyAdminToken(input.token);
        return await getAllAuditLogs(input.limit);
      }),
    getByEntity: publicProcedure
      .input(z.object({ token: z.string(), entityType: z.string(), entityId: z.number() }))
      .query(async ({ input }) => {
        verifyAdminToken(input.token);
        return await getAuditLogsByEntity(input.entityType, input.entityId);
      }),
  }),

  // Admin pathway management
  adminPathways: router({
    list: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        verifyAdminToken(input.token);
        return await getAllPathways();
      }),
    create: publicProcedure
      .input(
        z.object({
          token: z.string(),
          prerequisiteCourseId: z.number(),
          nextCourseId: z.number(),
          order: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        const { token, ...pathwayData } = input;
        
        // Validation 1: Check for duplicate pathway
        const existingPathways = await getAllPathways();
        const isDuplicate = existingPathways.some(
          p => p.prerequisiteCourseId === input.prerequisiteCourseId && p.nextCourseId === input.nextCourseId
        );
        if (isDuplicate) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "This pathway already exists. Cannot create duplicate pathways." 
          });
        }
        
        // Validation 2: Ensure non-immersive courses have a path to an immersive course
        const prereqCourse = await getCourseById(input.prerequisiteCourseId);
        const nextCourse = await getCourseById(input.nextCourseId);
        
        if (!prereqCourse || !nextCourse) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
        }
        
        // Helper function to check if a course has a path to an immersive course
        const hasPathToImmersive = async (courseId: number, visited: Set<number> = new Set()): Promise<boolean> => {
          if (visited.has(courseId)) return false; // Prevent infinite loops
          visited.add(courseId);
          
          const course = await getCourseById(courseId);
          if (!course) return false;
          
          // If this course is immersive, we found a path
          if (course.courseType === 'immersive') return true;
          
          // Check all prerequisites of this course
          const prerequisites = await getPrerequisites(courseId);
          for (const prereq of prerequisites) {
            if (await hasPathToImmersive(prereq.prerequisiteCourseId, visited)) {
              return true;
            }
          }
          
          return false;
        };
        
        // Validation: Check for circular dependencies
        // The next course should not already be in the prerequisite chain of the prerequisite course
        const isInPrereqChain = async (courseId: number, targetId: number, visited: Set<number> = new Set()): Promise<boolean> => {
          if (visited.has(courseId)) return false; // Prevent infinite loops
          if (courseId === targetId) return true; // Found the target in the chain
          visited.add(courseId);
          
          // Check all prerequisites of this course
          const prerequisites = await getPrerequisites(courseId);
          for (const prereq of prerequisites) {
            if (await isInPrereqChain(prereq.prerequisiteCourseId, targetId, visited)) {
              return true;
            }
          }
          
          return false;
        };
        
        // Check if the next course is already in the prerequisite chain
        const wouldCreateCycle = await isInPrereqChain(input.prerequisiteCourseId, input.nextCourseId);
        if (wouldCreateCycle) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: `Cannot create pathway: "${nextCourse.courseName}" is already in the prerequisite chain for "${prereqCourse.courseName}". This would create a circular dependency.` 
          });
        }
        
        // Validation 3: Check pathway depth limit (max 10 levels)
        const getPathwayDepth = async (courseId: number, visited: Set<number> = new Set()): Promise<number> => {
          if (visited.has(courseId)) return 0; // Prevent infinite loops
          visited.add(courseId);
          
          const course = await getCourseById(courseId);
          if (!course) return 0;
          
          // If this is an immersive course, depth is 0 (entry point)
          if (course.courseType === 'immersive') return 0;
          
          // Get all prerequisites and find the maximum depth
          const prerequisites = await getPrerequisites(courseId);
          if (prerequisites.length === 0) return 0;
          
          let maxDepth = 0;
          for (const prereq of prerequisites) {
            const depth = await getPathwayDepth(prereq.prerequisiteCourseId, new Set(visited));
            maxDepth = Math.max(maxDepth, depth);
          }
          
          return maxDepth + 1;
        };
        
        const currentDepth = await getPathwayDepth(input.prerequisiteCourseId);
        const MAX_PATHWAY_DEPTH = 10;
        
        if (currentDepth >= MAX_PATHWAY_DEPTH) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: `Cannot create pathway: This would exceed the maximum pathway depth of ${MAX_PATHWAY_DEPTH} levels. Consider restructuring your pathway to avoid overly deep chains.` 
          });
        }
        
        // Validation 4: If the next course is non-immersive, verify the prerequisite has a path to an immersive
        if (nextCourse.courseType !== 'immersive') {
          const prereqHasPath = await hasPathToImmersive(input.prerequisiteCourseId);
          
          if (!prereqHasPath) {
            throw new TRPCError({ 
              code: "BAD_REQUEST", 
              message: `Cannot create pathway: "${prereqCourse.courseName}" does not have a path to an immersive course. All career accelerator courses must eventually trace back to an immersive entry point.` 
            });
          }
        }
        
        await createPathway({ ...pathwayData, createdBy: username });
        
        await createAuditLog({
          adminUsername: username,
          action: "create",
          entityType: "pathway",
          entityId: input.prerequisiteCourseId,
          entityName: `${prereqCourse?.courseName} → ${nextCourse?.courseName}`,
          changeDescription: `Created pathway: ${prereqCourse?.courseName} → ${nextCourse?.courseName} (order: ${input.order})`,
        });
        
        return { success: true };
      }),
    update: publicProcedure
      .input(
        z.object({
          token: z.string(),
          id: z.number(),
          order: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        const { token, ...updateData } = input;
        
        // Get pathway info for authorization check
        const pathways = await getAllPathways();
        const pathway = pathways.find(p => p.id === updateData.id);
        if (!pathway) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pathway not found" });
        }
        
        // Check authorization
        const prereqCourse = await getCourseById(pathway.prerequisiteCourseId);
        const nextCourse = await getCourseById(pathway.nextCourseId);
        assertCanModify(username, pathway.createdBy, "pathway", `${prereqCourse?.courseName} → ${nextCourse?.courseName}`);
        
        await updatePathway(updateData.id, { order: updateData.order });
        
        await createAuditLog({
          adminUsername: username,
          action: "update",
          entityType: "pathway",
          entityId: updateData.id,
          entityName: `${prereqCourse?.courseName} → ${nextCourse?.courseName}`,
          changeDescription: `Updated pathway order: ${prereqCourse?.courseName} → ${nextCourse?.courseName} (order: ${updateData.order})`,
        });
        
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ token: z.string(), id: z.number() }))
      .mutation(async ({ input }) => {
        const username = getUsernameFromToken(input.token);
        
        // Get the pathway being deleted
        const allPathways = await getAllPathways();
        const pathwayToDelete = allPathways.find(p => p.id === input.id);
        
        if (!pathwayToDelete) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Pathway not found" });
        }
        
        // Check authorization
        const prereqCourse = await getCourseById(pathwayToDelete.prerequisiteCourseId);
        const nextCourse = await getCourseById(pathwayToDelete.nextCourseId);
        assertCanModify(username, pathwayToDelete.createdBy, "pathway", `${prereqCourse?.courseName} → ${nextCourse?.courseName}`);
        
        if (!pathwayToDelete) {
          throw new Error("Pathway not found");
        }
        
        // Check if deletion would orphan the next course
        // A pathway can be deleted if:
        // 1. The next course has no downstream dependencies, OR
        // 2. The next course has other incoming pathways (alternative prerequisites)
        const downstreamPathways = allPathways.filter(
          p => p.prerequisiteCourseId === pathwayToDelete.nextCourseId
        );
        
        if (downstreamPathways.length > 0) {
          // Check if there are alternative incoming pathways to the next course
          const alternativeIncomingPathways = allPathways.filter(
            p => p.nextCourseId === pathwayToDelete.nextCourseId && p.id !== input.id
          );
          
          // Only block deletion if there are downstream dependencies AND no alternative incoming pathways
          if (alternativeIncomingPathways.length === 0) {
            const downstreamCourseNames = downstreamPathways.map(p => {
              return `Course ID ${p.nextCourseId}`;
            }).join(", ");
            
            throw new Error(
              `Cannot delete this pathway: Course ID ${pathwayToDelete.nextCourseId} is a prerequisite for other courses (${downstreamCourseNames}) and has no alternative incoming pathways. Delete those downstream pathways first or add an alternative pathway.`
            );
          }
        }
        
        await deletePathway(input.id);
        
        await createAuditLog({
          adminUsername: username,
          action: "delete",
          entityType: "pathway",
          entityId: input.id,
          entityName: `${prereqCourse?.courseName} → ${nextCourse?.courseName}`,
          changeDescription: `Deleted pathway: ${prereqCourse?.courseName} → ${nextCourse?.courseName}`,
        });
        
        return { success: true };
      }),
  }),

  // Admin user management
  adminUsers: router({
    // List all admin users (global admin only)
    list: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const payload = verifyAdminToken(input.token);
        const admin = await getAdminByUsername(payload.username);
        if (!admin || admin.role !== "global_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only global admins can manage users" });
        }
        const allAdmins = await getAllAdminUsers();
        // Don't return password hashes
        return allAdmins.map(({ passwordHash, ...admin }) => admin);
      }),

    // Create admin user (global admin only)
    create: publicProcedure
      .input(z.object({
        token: z.string(),
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["global_admin", "admin"]),
      }))
      .mutation(async ({ input }) => {
        const payload = verifyAdminToken(input.token);
        const admin = await getAdminByUsername(payload.username);
        if (!admin || admin.role !== "global_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only global admins can create users" });
        }
        
        // Check if username already exists
        const existing = await getAdminByUsername(input.username);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Username already exists" });
        }
        
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        await createAdminUser({
          username: input.username,
          email: input.email,
          passwordHash,
          role: input.role,
          isFirstLogin: 1,
          createdBy: payload.username,
        });
        
        return { success: true };
      }),

    // Update admin user (global admin only)
    update: publicProcedure
      .input(z.object({
        token: z.string(),
        id: z.number(),
        email: z.string().email().optional(),
        role: z.enum(["global_admin", "admin"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const payload = verifyAdminToken(input.token);
        const admin = await getAdminByUsername(payload.username);
        if (!admin || admin.role !== "global_admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only global admins can update users" });
        }
        
        const updateData: any = {};
        if (input.email) updateData.email = input.email;
        if (input.role) updateData.role = input.role;
        
        await updateAdminUser(input.id, updateData);
        return { success: true };
      }),

    // Change own password
    changePassword: publicProcedure
      .input(z.object({
        token: z.string(),
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const payload = verifyAdminToken(input.token);
        const admin = await getAdminByUsername(payload.username);
        if (!admin) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Admin user not found" });
        }
        
        const isValid = await bcrypt.compare(input.currentPassword, admin.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
        }
        
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
        await updateAdminPassword(admin.id, newPasswordHash);
        
        return { success: true };
      }),

    // Check if first login
    checkFirstLogin: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const payload = verifyAdminToken(input.token);
        const admin = await getAdminByUsername(payload.username);
        if (!admin) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Admin user not found" });
        }
        return { isFirstLogin: admin.isFirstLogin === 1, role: admin.role };
      }),

    // Request password reset
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const { getAllAdminUsers } = await import("./db");
        const allAdmins = await getAllAdminUsers();
        const admin = allAdmins.find(a => a.email === input.email);
        
        // Always return success to prevent email enumeration
        if (!admin) {
          return { success: true };
        }
        
        const { generateResetToken, sendPasswordResetEmail } = await import("./emailService");
        const token = generateResetToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        await createPasswordResetToken({
          adminUserId: admin.id,
          token,
          expiresAt,
          used: 0,
        });
        
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        await sendPasswordResetEmail(admin.email, token, baseUrl);
        
        return { success: true };
      }),

    // Reset password with token
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const resetToken = await getPasswordResetToken(input.token);
        
        if (!resetToken || resetToken.used === 1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
        }
        
        if (new Date() > new Date(resetToken.expiresAt)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Reset token has expired" });
        }
        
        const bcrypt = require("bcryptjs");
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
        
        await updateAdminPassword(resetToken.adminUserId, newPasswordHash);
        await markTokenAsUsed(input.token);
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

