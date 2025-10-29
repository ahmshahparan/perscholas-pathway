import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Course types enum for Per Scholas training programs
 */
export const courseTypeEnum = pgEnum("course_type", [
  "immersive",
  "skill_based",
  "exam_cert",
  "completion_cert",
  "paid",
]);

/**
 * Domains table - stores technology domains
 */
export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: integer("isActive").default(1).notNull(),
  createdBy: varchar("createdBy", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Domain = typeof domains.$inferSelect;
export type InsertDomain = typeof domains.$inferInsert;

/**
 * Courses table - stores all training courses
 */
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseId: varchar("course_id", { length: 50 }),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  courseType: courseTypeEnum("course_type").notNull(),
  courseObjectives: text("course_objectives").notNull(),
  weeks: integer("weeks").notNull(),
  certificationsBadges: text("certifications_badges"),
  domainId: integer("domainId").notNull(),
  createdBy: varchar("createdBy", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

/**
 * Pathways table - defines prerequisite relationships between courses
 * Creates bidirectional relationships: prerequisite → next course
 */
export const pathways = pgTable("pathways", {
  id: serial("id").primaryKey(),
  prerequisiteCourseId: integer("prerequisite_course_id").notNull(),
  nextCourseId: integer("next_course_id").notNull(),
  order: integer("order").default(1).notNull(),
  createdBy: varchar("createdBy", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Pathway = typeof pathways.$inferSelect;
export type InsertPathway = typeof pathways.$inferInsert;

/**
 * Admin role enum
 */
export const adminRoleEnum = pgEnum("admin_role", ["global_admin", "admin"]);

/**
 * Admin users table - stores admin credentials for backend management
 */
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: adminRoleEnum("role").default("admin").notNull(),
  isFirstLogin: integer("is_first_login").default(1).notNull(),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * Password reset tokens table - stores temporary tokens for password reset
 */
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: integer("used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Action enum for audit logs
 */
export const actionEnum = pgEnum("action", ["create", "update", "delete"]);

/**
 * Entity type enum for audit logs
 */
export const entityTypeEnum = pgEnum("entity_type", ["course", "pathway", "domain", "job_role"]);

/**
 * Audit logs table - tracks all admin actions
 */
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminUsername: varchar("adminUsername", { length: 100 }).notNull(),
  action: actionEnum("action").notNull(),
  entityType: entityTypeEnum("entityType").notNull(),
  entityId: integer("entityId").notNull(),
  entityName: varchar("entityName", { length: 255 }).notNull(),
  changeDescription: text("changeDescription").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Job roles table - stores available job roles/titles
 */
export const jobRoles = pgTable("job_roles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull().unique(),
  description: text("description"),
  salaryRange: varchar("salary_range", { length: 100 }),
  isActive: integer("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type JobRole = typeof jobRoles.$inferSelect;
export type InsertJobRole = typeof jobRoles.$inferInsert;

/**
 * Course-Job Roles junction table - many-to-many relationship
 * Each course can prepare for multiple job roles (max 2 as per requirement)
 */
export const courseJobRoles = pgTable("course_job_roles", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  jobRoleId: integer("job_role_id").notNull(),
  isPrimary: integer("is_primary").default(0).notNull(), // 1 for primary role, 0 for secondary
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CourseJobRole = typeof courseJobRoles.$inferSelect;
export type InsertCourseJobRole = typeof courseJobRoles.$inferInsert;

// TODO: Add your tables here


