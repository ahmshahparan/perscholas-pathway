# Project TODO

## Completed Features
- [x] Basic course catalog with immersive and career accelerator courses
- [x] Course detail pages with prerequisites and next steps
- [x] Bidirectional pathway management with visual editor
- [x] Admin authentication with RBAC (5 admin users)
- [x] Admin dashboard for CRUD operations on courses, pathways, domains
- [x] Domain management system
- [x] Comprehensive audit logging system
- [x] Job roles system with career outcomes (up to 2 per course)
- [x] Breadcrumbs, back-to-top button, empty states, loading skeletons
- [x] Duplicate prevention and circular dependency checks
- [x] Cascade delete and pathway depth limits
- [x] WCAG 2.1 AA accessibility compliance
- [x] Per Scholas branding applied consistently
- [x] Fixed database schema mapping issues
- [x] Fixed circular pathway dependency
- [x] Fixed React hydration errors
- [x] Fixed mobile responsiveness for course type badges

- [x] Show all available course information on individual course detail page (job roles, domain, certifications, all metadata)
- [x] Add Job Roles management tab to admin dashboard with CRUD operations
- [x] Add duplicate prevention for job role entries
- [x] Support manual entry for job roles with full CRUD operations

## Pending Features
- [ ] Integrate O*NET or BLS API to search and import job role data (title, description, salary) - requires API credentials


- [x] Remove dollar signs from salary range display on course detail page


- [x] Remove money bag emoji (💰) from salary range display


- [x] Migrate database from MySQL to PostgreSQL (Supabase compatibility)


- [x] Fix database query errors - tables don't exist in PostgreSQL database
- [x] Create tables in Supabase PostgreSQL database
- [x] Seed initial data (domains, job roles, courses, pathways)
- [x] Create admin user for dashboard access


- [x] Remove Manus OAuth authentication system entirely
- [x] Update application to use only admin_users table authentication
- [x] Remove OAuth dependencies and environment variables
- [x] Fix global_admin permissions - check role instead of hardcoded username


- [x] Fix "require is not defined" error on /admin/users page


- [x] Prepare application for Vercel deployment
- [ ] User to deploy application to Vercel with Supabase database


- [ ] Fix custom domain (pathway.psitlab.com) - API requests returning 500 errors


- [x] Prepare complete Vercel deployment package with all configurations

