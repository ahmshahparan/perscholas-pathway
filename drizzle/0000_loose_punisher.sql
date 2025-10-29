CREATE TYPE "public"."action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('global_admin', 'admin');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('immersive', 'skill_based', 'exam_cert', 'completion_cert', 'paid');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('course', 'pathway', 'domain', 'job_role');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"is_first_login" integer DEFAULT 1 NOT NULL,
	"created_by" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminUsername" varchar(100) NOT NULL,
	"action" "action" NOT NULL,
	"entityType" "entity_type" NOT NULL,
	"entityId" integer NOT NULL,
	"entityName" varchar(255) NOT NULL,
	"changeDescription" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_job_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"job_role_id" integer NOT NULL,
	"is_primary" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar(50),
	"course_name" varchar(255) NOT NULL,
	"course_type" "course_type" NOT NULL,
	"course_objectives" text NOT NULL,
	"weeks" integer NOT NULL,
	"certifications_badges" text,
	"domainId" integer NOT NULL,
	"createdBy" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdBy" varchar(100) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"salary_range" varchar(100),
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_roles_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pathways" (
	"id" serial PRIMARY KEY NOT NULL,
	"prerequisite_course_id" integer NOT NULL,
	"next_course_id" integer NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	"createdBy" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
