# Per Scholas Training Pathway Manager

A full-stack web application for managing and browsing Per Scholas training pathways with bidirectional course relationships.

## Features

### Public Features
- **Course Catalog**: Browse immersive and career accelerator courses
- **Course Details**: View comprehensive course information including:
  - Course objectives and certifications
  - Prerequisites (courses that must be completed first)
  - Available next steps (courses unlocked after completion)
  - Bidirectional relationship visualization
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### Admin Features
- **Secure Authentication**: Static username/password authentication for admin users
- **Course Management**: Create, edit, and delete courses
- **Pathway Management**: Create bidirectional pathways between courses
- **Course Types**:
  - Immersive (entry-level bootcamps)
  - Career Accelerator - Skill Based
  - Career Accelerator - Exam Based Cert
  - Career Accelerator - Completion Based Cert
  - Career Accelerator - Paid

### Technical Features
- **Bidirectional Relationships**: Pathways automatically sync in both directions
- **Type-Safe API**: End-to-end type safety with tRPC
- **Modern Stack**: React 19, TypeScript, Tailwind CSS 4, Express
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: JWT-based admin authentication

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Wouter (routing)
- **Backend**: Express 4, tRPC 11
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: JWT, bcryptjs
- **UI Components**: shadcn/ui, Radix UI
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- MySQL or TiDB database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/perscholas-pathway.git
   cd perscholas-pathway
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL`: Your MySQL/TiDB connection string
   - `JWT_SECRET`: A secure random string
   - Other variables as needed

4. Run database migrations:
   ```bash
   pnpm db:push
   ```

5. Seed the database with initial data:
   ```bash
   npx tsx scripts/seed.ts
   ```

6. Start the development server:
   ```bash
   pnpm dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Default Admin Credentials

After seeding, you can log in with:

- **Usernames**: `admin-global`, `admin-it`, `admin-se`, `admin-manuops`, `admin-misc`
- **Password**: `perscholas2024`

**⚠️ Important**: Change these passwords in production!

## Project Structure

```
perscholas-pathway/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and tRPC client
│   │   └── App.tsx        # Main app component with routing
├── server/                # Backend Express application
│   ├── routers.ts         # tRPC API routes
│   ├── db.ts              # Database query functions
│   ├── adminAuth.ts       # Admin authentication logic
│   └── _core/             # Framework core (don't modify)
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Database table definitions
├── scripts/               # Utility scripts
│   └── seed.ts            # Database seeding script
└── shared/                # Shared types and constants
```

## Database Schema

### Tables

#### `courses`
- Stores all training courses (immersive and career accelerator)
- Fields: id, courseId, courseName, courseType, courseObjectives, weeks, certificationsBadges, isActive

#### `pathways`
- Defines prerequisite relationships between courses
- Creates bidirectional links automatically
- Fields: id, prerequisiteCourseId, nextCourseId, order

#### `admin_users`
- Stores admin credentials
- Fields: id, username, passwordHash

#### `users`
- Stores Manus OAuth users (if using Manus authentication)
- Fields: id, openId, name, email, role

## API Endpoints (tRPC)

### Public Endpoints

- `courses.list`: Get all active courses with next steps count
- `courses.getById`: Get course details by database ID
- `courses.getByCourseId`: Get course details by course ID string
- `admin.login`: Admin authentication

### Admin Endpoints (require JWT token)

- `adminCourses.create`: Create a new course
- `adminCourses.update`: Update course details
- `adminCourses.delete`: Soft delete a course
- `adminPathways.list`: List all pathways
- `adminPathways.create`: Create a new pathway
- `adminPathways.delete`: Delete a pathway

## Development

### Running Tests

```bash
pnpm test
```

### Database Migrations

After modifying `drizzle/schema.ts`:

```bash
pnpm db:push
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:
- Vercel deployment
- Supabase/TiDB database setup
- Environment variable configuration
- Post-deployment setup

## Usage Guide

### For Learners (Public View)

1. Visit the homepage
2. Click "Browse Courses" to see all available courses
3. Courses are organized by type (Immersive vs Career Accelerator)
4. Click on any course to view:
   - Course details and objectives
   - Prerequisites needed
   - Available next steps after completion

### For Administrators

1. Click "Admin Login" from the homepage
2. Enter your admin credentials
3. From the admin dashboard, you can:
   - **Create Course**: Add a new course with all metadata
   - **Create Pathway**: Link two courses (prerequisite → next course)
   - **Delete Course**: Soft delete removes from pathways but keeps data
   - **View All Courses**: See all courses in the system

### Creating Bidirectional Pathways

When you create a pathway from Course A to Course B:
- Course A automatically shows Course B in "Available Next Steps"
- Course B automatically shows Course A in "Prerequisites"
- No manual syncing required!

## Course Types Explained

1. **Immersive**: Entry-level bootcamp programs (12-15 weeks)
   - Full Stack Web Development
   - Data Science
   - UX/UI Design
   - IT Support

2. **Career Accelerator - Skill Based**: Advanced skill development courses
   - Backend Architecture & Microservices
   - Advanced React & State Management

3. **Career Accelerator - Exam Based Cert**: Courses leading to certification exams
   - Industry-recognized certifications

4. **Career Accelerator - Completion Based Cert**: Certificate upon completion
   - Full Stack Performance Optimization

5. **Career Accelerator - Paid**: Premium advanced courses
   - Specialized training programs

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team

## Roadmap

- [ ] Add course search and filtering
- [ ] Implement course enrollment tracking
- [ ] Add learner progress tracking
- [ ] Create pathway visualization diagram
- [ ] Add email notifications for new courses
- [ ] Implement course reviews and ratings
- [ ] Add bulk course import/export
- [ ] Create mobile app version

