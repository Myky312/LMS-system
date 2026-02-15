# LMS Backend - BaitulQuran

A complete Learning Management System backend built with NestJS, Drizzle ORM, PostgreSQL, and JWT authentication.

## What Is Implemented

- **Authentication**: Email/password login, JWT access and refresh tokens, stateless (no server-side sessions). Passwords hashed with bcrypt.
- **Content hierarchy**: Courses → modules (ordered) → lessons (ordered) → tasks. Teachers create and own courses; ordering is backend-controlled via `order_index`.
- **Ownership**: Teachers only access their own courses. Every write (create module/lesson/task, review submission) checks the chain (e.g. lesson → module → course → `created_by === teacherId`). Admins bypass checks.
- **Tasks**: Single polymorphic `tasks` table with `type` (QUIZ, AUDIO, PHOTO) and JSONB `config`. Config validated per type with Zod at creation and submission. QUIZ: exactly 4 options, `correctAnswer` 0–3.
- **Submissions**: One submission per (task, student)—DB unique constraint + app check (idempotency). QUIZ auto-graded (correct → APPROVED, wrong → REJECTED); AUDIO/PHOTO start as PENDING, teacher reviews via PATCH.
- **Soft deletes**: All content tables have `deleted_at`. No hard deletes. All reads filter out deleted rows; if a parent is deleted (e.g. course), children (modules, lessons, tasks) return 404 (child invisibility).
- **Media**: No file upload through the API. Client gets a presigned S3 URL from the backend and uploads directly to S3.
- **E2E tests**: Jest + Supertest; separate test DB (`TEST_DATABASE_URL`); migrations run on test DB before each run; truncate + seed per suite; pool closed in teardown.

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

### What We Use on the Backend (in detail)

| Layer | Technology | Use |
|--------|------------|-----|
| Runtime | Node.js 20+ | Server execution. |
| Language | TypeScript (strict) | Strict mode; type-safe codebase. |
| Framework | NestJS 11 | Modules, DI, guards (`JwtAuthGuard`, `RolesGuard`), pipes (`ZodValidationPipe`), filters, Swagger. |
| ORM | Drizzle | Single Postgres connection, type-safe queries, `db.transaction()` for submit/review/lesson create, schema in `src/database/schema/`. |
| Database | PostgreSQL 15+ | Single DB; all tables in one schema; UUIDs, JSONB for task config/answers. |
| Auth | JWT + bcrypt | `@nestjs/jwt` + `jsonwebtoken` for sign/verify; bcrypt for password hash; access (short) + refresh (long) tokens. |
| Validation | Zod | Per-route body validation via `ZodValidationPipe` and DTO schemas; task config validated by type (no global class-validator). |
| Storage | S3-compatible | `aws-sdk` v2 for presigned URLs only; no file bytes through backend. |
| Docs | Swagger | Controller/DTO annotations; served at `/api/docs`. |
| Tests | Jest, Supertest | E2E in `test/*.e2e-spec.ts`; test DB via `TEST_DATABASE_URL`; migrations in setup; pool closed in teardown. |

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

## How It's Done

- **Auth flow**: Login POST sends email/password → bcrypt compare → JWT access + refresh returned. Protected routes use `JwtAuthGuard` (validates Bearer token, sets `request.user`) then `RolesGuard` (checks `@Roles()`). `@CurrentUser()` reads `user.userId` / `user.role` from the request.
- **Ownership**: Services call explicit checks, e.g. `ModulesService.verifyOwnership(moduleId, teacherId)` loads module → course and ensures `course.created_by === teacherId`. Same pattern for lessons (via module) and tasks (via lesson → module → course). Submission review allowed only for tasks in the teacher’s course.
- **Soft deletes**: All content queries use `whereConditions(table.deletedAt, …)` or `notDeleted(table.deletedAt)` from `common/utils/soft-delete.util.ts`. “Delete” is `UPDATE … SET deleted_at = now()`. Child invisibility: `ModulesService.findOne` joins `courses` and returns 404 if course is deleted; `LessonsService.findOne` joins modules + courses; `TasksService.findOne` joins lessons + modules + courses—so deleting a course hides all children.
- **Validation**: Each endpoint that accepts a body uses a Zod schema with `ZodValidationPipe`. Task config is validated in `tasks/validators/task-config.validator.ts` by type (QUIZ: 4 options, correctAnswer in range; etc.). Invalid input → 422 with Zod message.
- **Quiz grading**: On submit for a QUIZ task, `QuizGraderService` compares `answer.selectedOption` to `config.correctAnswer` and sets status APPROVED/REJECTED and score. Submission create + grading run in a Drizzle transaction. Duplicate submit (same task + student) → 400 (idempotency).
- **Errors**: Global `AllExceptionsFilter` formats all errors to a standard JSON shape (statusCode, error, message). 401 for auth, 403 for forbidden, 422 for validation.

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
   pnpm run db:generate
   pnpm run db:migrate
   ```
   See **Database migrations** below for the full workflow.

5. **Start the server**
   ```bash
   # Development
   pnpm run start:dev
   
   # Production
   pnpm run build
   pnpm run start:prod
   ```

## Database migrations

Migrations live in `src/database/migrations/`. **Do not edit existing migration files**; add new ones via `db:generate`.

### Daily workflow (schema change)

1. Edit schema in `src/database/schema/*.ts`.
2. **Generate** (creates new SQL file; does not touch the DB):
   ```bash
   pnpm run db:generate
   ```
3. **Apply** (runs pending SQL against `DATABASE_URL`):
   ```bash
   pnpm run db:migrate
   ```
4. **Test DB**: E2E setup runs `db:migrate` against `TEST_DATABASE_URL` before each test run, so the test DB schema always matches the app DB. To run migrations on the test DB manually: `DATABASE_URL="$TEST_DATABASE_URL" pnpm run db:migrate`

**Rule:** use `db:generate` → `db:migrate`. Do **not** use `db:push` for the main or test DB in normal workflow (it skips migration history).

### Scripts

| Script   | Command                  | Effect |
|----------|--------------------------|--------|
| Generate | `pnpm run db:generate`    | Compares schema to last migration → writes new `.sql` in `src/database/migrations/`. Does not touch DB. |
| Migrate  | `pnpm run db:migrate`     | Runs pending migrations against `DATABASE_URL`. Modifies DB. |
| Push     | `pnpm run db:push`        | Syncs schema directly to DB. No migration files. Avoid for app/test DB. |
| Studio   | `pnpm run db:studio`      | Opens Drizzle Studio (DB GUI). |

### Folder layout

- `src/database/migrations/0000_*.sql`, `0001_*.sql`, … — migration files (one per schema change).
- `src/database/migrations/meta/` — Drizzle journal and snapshots; keep as-is.

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
- `deleted_at` (TIMESTAMP, nullable) — soft delete

### Modules
- `id` (UUID)
- `course_id` (UUID → courses.id)
- `title` (TEXT)
- `order_index` (INT)
- `deleted_at` (TIMESTAMP, nullable) — soft delete

### Lessons
- `id` (UUID)
- `module_id` (UUID → modules.id)
- `title` (TEXT)
- `video_url` (TEXT)
- `order_index` (INT)
- `deleted_at` (TIMESTAMP, nullable) — soft delete

### Tasks (Polymorphic)
- `id` (UUID)
- `lesson_id` (UUID → lessons.id)
- `type` (ENUM: QUIZ, AUDIO, PHOTO)
- `config` (JSONB) - Type-specific configuration
- `deleted_at` (TIMESTAMP, nullable) — soft delete

### Task Submissions
- `id` (UUID)
- `task_id` (UUID → tasks.id)
- `student_id` (UUID → users.id)
- `answer` (JSONB)
- `status` (ENUM: PENDING, APPROVED, REJECTED)
- `teacher_feedback` (TEXT)
- `created_at` (TIMESTAMP)
- `deleted_at` (TIMESTAMP, nullable) — soft delete
- UNIQUE(task_id, student_id) — one submission per task per student (idempotency)

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
- `pnpm run test:e2e` - Run E2E tests (uses `TEST_DATABASE_URL`; migrations run on test DB before each run)

## Notes

- All passwords are hashed with bcrypt
- JWT tokens are stateless (no session storage)
- Media uploads use presigned S3 URLs (direct client upload)
- Quiz tasks are auto-graded; Audio/Photo require teacher review
- All endpoints are documented in Swagger
- Global error handling with standardized error format
