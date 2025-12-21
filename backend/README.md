# LMS Backend - BaitulQuran

A complete Learning Management System backend built with NestJS, Drizzle ORM, PostgreSQL, and JWT authentication.

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **Framework**: NestJS 11
- **ORM**: Drizzle
- **Database**: PostgreSQL 15+
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Storage**: S3-compatible (AWS S3 / MinIO)
- **Docs**: Swagger
- **Package Manager**: pnpm

## Project Structure

```
BaitulQuran/
 ├── backend/              # Backend application
 │    ├── src/
 │    │    ├── app.module.ts
 │    │    ├── main.ts
 │    │    ├── config/              # Configuration files
 │    │    ├── database/
 │    │    │    ├── drizzle.ts      # Database connection
 │    │    │    ├── schema/         # Drizzle schemas
 │    │    │    │    ├── users.ts
 │    │    │    │    ├── courses.ts
 │    │    │    │    ├── modules.ts
 │    │    │    │    ├── lessons.ts
 │    │    │    │    ├── tasks.ts
 │    │    │    │    └── submissions.ts
 │    │    ├── auth/                # Authentication module
 │    │    ├── courses/             # Courses & Modules
 │    │    ├── lessons/             # Lessons
 │    │    ├── tasks/               # Tasks (polymorphic)
 │    │    ├── submissions/         # Task submissions
 │    │    ├── media/               # S3 presigned URLs
 │    │    └── common/
 │    │         ├── guards/         # JWT & Role guards
 │    │         ├── decorators/     # @Roles, @CurrentUser
 │    │         ├── enums/          # UserRole, TaskType, SubmissionStatus
 │    │         ├── dto/            # Zod validation pipe
 │    │         └── filters/        # Global exception filter
 │    ├── test/                     # E2E tests
 │    ├── package.json
 │    ├── tsconfig.json
 │    ├── drizzle.config.ts
 │    ├── .env                      # Environment variables (create from .env.example)
 │    └── .env.example              # Environment template
 └── README.md
```

## Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Generate migrations
   pnpm run db:generate
   
   # Run migrations
   pnpm run db:migrate
   
   # Or push schema directly (dev only)
   pnpm run db:push
   ```

5. **Start the server**
   ```bash
   # Development
   pnpm run start:dev
   
   # Production
   pnpm run build
   pnpm run start:prod
   ```

## API Documentation

Once the server is running, access Swagger documentation at:
- **URL**: http://localhost:3000/api/docs

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (client-side token discard)

### Courses (Teacher/Admin)
- `POST /api/courses` - Create course
- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/modules` - Create module
- `GET /api/courses/:id/modules` - List modules

### Lessons
- `POST /api/modules/:moduleId/lessons` - Create lesson (Teacher/Admin)
- `GET /api/modules/:moduleId/lessons` - List lessons
- `GET /api/modules/:moduleId/lessons/:id` - Get lesson

### Tasks
- `POST /api/lessons/:lessonId/tasks` - Create task (Teacher/Admin)
- `GET /api/lessons/:lessonId/tasks` - List tasks
- `GET /api/lessons/:lessonId/tasks/:id` - Get task

### Submissions
- `POST /api/tasks/:id/submit` - Submit task (Student)
- `GET /api/submissions` - List submissions (Teacher/Admin)
- `GET /api/submissions/:id` - Get submission
- `PATCH /api/submissions/:id/review` - Review submission (Teacher/Admin)

### Media
- `POST /api/media/presign` - Get presigned S3 upload URL

## Database Schema

### Users
- `id` (UUID)
- `email` (TEXT, UNIQUE)
- `password_hash` (TEXT)
- `role` (ENUM: ADMIN, TEACHER, STUDENT)
- `created_at` (TIMESTAMP)

### Courses
- `id` (UUID)
- `title` (TEXT)
- `description` (TEXT)
- `created_by` (UUID → users.id)
- `created_at` (TIMESTAMP)

### Modules
- `id` (UUID)
- `course_id` (UUID → courses.id)
- `title` (TEXT)
- `order_index` (INT)

### Lessons
- `id` (UUID)
- `module_id` (UUID → modules.id)
- `title` (TEXT)
- `video_url` (TEXT)
- `order_index` (INT)

### Tasks (Polymorphic)
- `id` (UUID)
- `lesson_id` (UUID → lessons.id)
- `type` (ENUM: QUIZ, AUDIO, PHOTO)
- `config` (JSONB) - Type-specific configuration

### Task Submissions
- `id` (UUID)
- `task_id` (UUID → tasks.id)
- `student_id` (UUID → users.id)
- `answer` (JSONB)
- `status` (ENUM: PENDING, APPROVED, REJECTED)
- `teacher_feedback` (TEXT)
- `created_at` (TIMESTAMP)

## Role-Based Access Control

- **ADMIN**: Full access to everything
- **TEACHER**: Can create/manage their own courses, modules, lessons, tasks. Can review submissions for their courses.
- **STUDENT**: Can view courses/lessons and submit tasks. Cannot create content.

## Task Types

### QUIZ
- Auto-graded
- Config: `{ question: string, options: string[], correctAnswer: number }`
- Answer: `{ selectedOption: number }`

### AUDIO
- Manual review required
- Config: `{ instructions?: string, maxDuration?: number }`
- Answer: `{ audioUrl: string }`

### PHOTO
- Manual review required
- Config: `{ instructions?: string, requiredElements?: string[] }`
- Answer: `{ photoUrl: string }`

## Environment Variables

See `backend/.env.example` for all required environment variables.

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `AWS_REGION` - AWS region for S3
- `AWS_S3_BUCKET` - S3 bucket name
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `PORT` - Server port (default: 3000)

## Development Scripts

All scripts should be run from the `backend/` directory:

- `pnpm run start:dev` - Start in watch mode
- `pnpm run build` - Build for production
- `pnpm run lint` - Run ESLint
- `pnpm run format` - Format with Prettier
- `pnpm run db:generate` - Generate Drizzle migrations
- `pnpm run db:migrate` - Run migrations
- `pnpm run db:push` - Push schema (dev only)
- `pnpm run db:studio` - Open Drizzle Studio

## Notes

- All passwords are hashed with bcrypt
- JWT tokens are stateless (no session storage)
- Media uploads use presigned S3 URLs (direct client upload)
- Quiz tasks are auto-graded; Audio/Photo require teacher review
- All endpoints are documented in Swagger
- Global error handling with standardized error format
