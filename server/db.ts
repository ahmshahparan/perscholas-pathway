import { eq, and, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, courses, pathways, adminUsers, domains, auditLogs, passwordResetTokens, jobRoles, courseJobRoles, InsertCourse, InsertPathway, InsertAdminUser, InsertDomain, InsertAuditLog, InsertPasswordResetToken } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Admin Users ============
export async function getAdminByUsername(username: string) {
  console.log('[DB] getAdminByUsername called for:', username);
  const db = await getDb();
  if (!db) {
    console.log('[DB] Database not available');
    return undefined;
  }
  console.log('[DB] Querying admin_users table');
  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  console.log('[DB] Query result:', result.length, 'rows');
  if (result.length > 0) {
    console.log('[DB] Found user:', result[0].username);
  }
  return result.length > 0 ? result[0] : undefined;
}

export async function createAdminUser(data: InsertAdminUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adminUsers).values(data);
}

// ============ Courses ============
export async function getAllCourses() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(courses);
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCourseByCourseId(courseId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.courseId, courseId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function checkDuplicateCourse(courseName: string) {
  const db = await getDb();
  if (!db) return null;
  // Case-insensitive check by comparing lowercase versions
  const result = await db
    .select()
    .from(courses)
    .where(sql`LOWER(${courses.courseName}) = LOWER(${courseName})`)
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createCourse(data: Omit<InsertCourse, 'courseId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check for duplicate course name
  const duplicate = await checkDuplicateCourse(data.courseName);
  if (duplicate) {
    throw new Error(`A course with the name "${data.courseName}" already exists (ID: ${duplicate.courseId})`);
  }
  
  const result = await db.insert(courses).values(data).returning();
  const insertId = result[0].id;
  // Auto-generate courseId from database ID
  const courseId = `CRS-${insertId}`;
  await db.update(courses).set({ courseId }).where(eq(courses.id, insertId));
  return { ...result[0], courseId };
}

export async function updateCourse(id: number, data: Partial<InsertCourse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Hard delete
  await db.delete(courses).where(eq(courses.id, id));
}

// ============ Job Roles ============
export async function getJobRolesForCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: jobRoles.id,
      title: jobRoles.title,
      description: jobRoles.description,
      salaryRange: jobRoles.salaryRange,
      isPrimary: courseJobRoles.isPrimary,
    })
    .from(courseJobRoles)
    .innerJoin(jobRoles, eq(courseJobRoles.jobRoleId, jobRoles.id))
    .where(eq(courseJobRoles.courseId, courseId))
    .orderBy(desc(courseJobRoles.isPrimary)); // Primary roles first
  return result;
}

export async function getAllJobRoles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(jobRoles).where(eq(jobRoles.isActive, 1));
}

export async function createJobRole(data: { title: string; description?: string; salaryRange?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check for duplicate title
  const existing = await db.select().from(jobRoles).where(eq(jobRoles.title, data.title)).limit(1);
  if (existing.length > 0) {
    throw new Error("A job role with this title already exists");
  }
  
  const result = await db.insert(jobRoles).values({
    title: data.title,
    description: data.description || null,
    salaryRange: data.salaryRange || null,
    isActive: 1,
  }).returning();
  
  return result;
}

export async function updateJobRole(id: number, data: { title?: string; description?: string; salaryRange?: string; isActive?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If updating title, check for duplicates
  if (data.title) {
    const existing = await db.select().from(jobRoles)
      .where(eq(jobRoles.title, data.title))
      .limit(1);
    if (existing.length > 0 && existing[0].id !== id) {
      throw new Error("A job role with this title already exists");
    }
  }
  
  const result = await db.update(jobRoles)
    .set(data)
    .where(eq(jobRoles.id, id));
  
  return result;
}

export async function deleteJobRole(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Soft delete by setting isActive to 0
  const result = await db.update(jobRoles)
    .set({ isActive: 0 })
    .where(eq(jobRoles.id, id));
  
  return result;
}

export async function checkDuplicateJobRole(title: string, excludeId?: number) {
  const db = await getDb();
  if (!db) return false;
  
  const query = db.select().from(jobRoles).where(eq(jobRoles.title, title));
  const result = await query.limit(1);
  
  if (result.length === 0) return false;
  if (excludeId && result[0].id === excludeId) return false;
  
  return true;
}

// ============ Pathways ============
export async function getPrerequisites(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: pathways.id,
      prerequisiteCourseId: pathways.prerequisiteCourseId,
      nextCourseId: pathways.nextCourseId,
      order: pathways.order,
      course: courses,
    })
    .from(pathways)
    .innerJoin(courses, eq(pathways.prerequisiteCourseId, courses.id))
    .where(eq(pathways.nextCourseId, courseId));
  return result;
}

export async function getNextSteps(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: pathways.id,
      prerequisiteCourseId: pathways.prerequisiteCourseId,
      nextCourseId: pathways.nextCourseId,
      order: pathways.order,
      course: courses,
    })
    .from(pathways)
    .innerJoin(courses, eq(pathways.nextCourseId, courses.id))
    .where(eq(pathways.prerequisiteCourseId, courseId));
  return result;
}

export async function checkDuplicatePathway(prerequisiteCourseId: number, nextCourseId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(pathways)
    .where(
      and(
        eq(pathways.prerequisiteCourseId, prerequisiteCourseId),
        eq(pathways.nextCourseId, nextCourseId)
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPathway(data: InsertPathway) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if next course is immersive (immersive courses can only be entry points)
  const nextCourse = await getCourseById(data.nextCourseId);
  if (nextCourse?.courseType === "immersive") {
    throw new Error(
      `Cannot add "${nextCourse.courseName}" as a next step. Immersive courses can only be entry points in a pathway.`
    );
  }
  
  // Check for duplicate pathway
  const duplicate = await checkDuplicatePathway(data.prerequisiteCourseId, data.nextCourseId);
  if (duplicate) {
    const prereqCourse = await getCourseById(data.prerequisiteCourseId);
    throw new Error(
      `This pathway already exists: "${prereqCourse?.courseName}" → "${nextCourse?.courseName}" (Order: ${duplicate.order})`
    );
  }
  
  await db.insert(pathways).values(data);
}

export async function updatePathway(id: number, data: { order: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pathways).set(data).where(eq(pathways.id, id));
}

export async function deletePathway(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pathways).where(eq(pathways.id, id));
}

// ============ Domains ============
export async function getAllDomains() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(domains).where(eq(domains.isActive, 1));
  return result;
}

export async function createDomain(data: Omit<InsertDomain, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(domains).values(data);
}

export async function updateDomain(id: number, data: Partial<Omit<InsertDomain, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(domains).set(data).where(eq(domains.id, id));
}

export async function deleteDomain(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if domain is used by any active courses
  const coursesUsingDomain = await db.select().from(courses).where(eq(courses.domainId, id));
  if (coursesUsingDomain.length > 0) {
    throw new Error(`Cannot delete domain: ${coursesUsingDomain.length} active course(s) are using this domain`);
  }
  await db.update(domains).set({ isActive: 0 }).where(eq(domains.id, id));
}

export async function getAllPathways() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(pathways);
  return result;
}

// ============ Audit Logs ============
export async function createAuditLog(data: Omit<InsertAuditLog, 'id' | 'timestamp'>) {
  const db = await getDb();
  if (!db) {
    console.warn("[AuditLog] Cannot create audit log: database not available");
    return;
  }
  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("[AuditLog] Failed to create audit log:", error);
  }
}

export async function getAuditLogsByEntity(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, entityType as any), eq(auditLogs.entityId, entityId)))
    .orderBy(desc(auditLogs.timestamp));
  return result;
}

export async function getAllAuditLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
  return result;
}

export async function getAllAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(adminUsers);
}

export async function getAdminById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAdminUser(id: number, data: Partial<InsertAdminUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminUsers).set(data).where(eq(adminUsers.id, id));
}

export async function updateAdminPassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(adminUsers).set({ passwordHash, isFirstLogin: 0 }).where(eq(adminUsers.id, id));
}

// ============ Password Reset Tokens ============
export async function createPasswordResetToken(data: InsertPasswordResetToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passwordResetTokens).values(data);
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markTokenAsUsed(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({ used: 1 }).where(eq(passwordResetTokens.token, token));
}


// ============ Job Roles ============
export async function addJobRolesToCourse(courseId: number, jobRoleIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (let i = 0; i < jobRoleIds.length; i++) {
    const jobRoleId = jobRoleIds[i];
    const isPrimary = i === 0; // First role is primary
    await db.insert(courseJobRoles).values({
      courseId,
      jobRoleId,
      isPrimary: isPrimary ? 1 : 0,
    });
  }
}

