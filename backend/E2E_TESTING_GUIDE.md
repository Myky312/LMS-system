# E2E Testing Guide

## Quick Start

### 1. Set Up Test Database

```bash
cd backend

# Create test database
createdb lms_test

# Or using psql:
# psql -U postgres -c "CREATE DATABASE lms_test;"
```

### 2. Configure Test Environment

Copy `.env.test` and update with your test database credentials:

```bash
cp .env.test .env.test.local
# Edit .env.test.local with your test DB credentials
```

### 3. Run Migrations on Test DB

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/lms_test pnpm run db:migrate
```

### 4. Run Tests

```bash
pnpm run test:e2e
```

## Test Structure

```
test/
 ├── utils/
 │    ├── test-app.ts      # Test app factory
 │    ├── auth.ts          # Auth helpers & test users
 │    └── db-setup.ts      # DB isolation utilities
 ├── auth.e2e-spec.ts      # Authentication tests
 ├── ownership.e2e-spec.ts # Ownership violation tests
 ├── quiz.e2e-spec.ts      # Quiz auto-grading tests
 ├── submissions.e2e-spec.ts # Idempotency & transactions
 ├── soft-delete.e2e-spec.ts # Soft delete visibility
 └── setup-e2e.ts          # Test environment setup
```

## Test Coverage

### ✅ Authentication
- Valid login → tokens
- Invalid credentials → 401
- Protected routes without token → 401
- Invalid token → 401

### ✅ Ownership Violation
- Teacher B cannot modify Teacher A's content → 403
- All ownership checks enforced

### ✅ Quiz Auto-Grading
- Correct answer → APPROVED
- Incorrect answer → REJECTED
- Invalid input → 422
- Deterministic grading

### ✅ Submission Idempotency
- Duplicate submission → 400
- Only one submission in DB
- DB constraint enforced

### ✅ Transaction Rollback
- Invalid submission → no DB row inserted
- Valid submission → row inserted
- Direct DB verification

### ✅ Soft Delete Visibility
- Deleted course not in list
- Deleted course → 404 on access
- Child invisibility after parent delete
- Student cannot submit to deleted task

## Test Users

Pre-seeded in every test:
- `admin@test.com` / `admin123` - ADMIN
- `teachera@test.com` / `teacher123` - TEACHER
- `teacherb@test.com` / `teacher123` - TEACHER
- `student@test.com` / `student123` - STUDENT

## Database Isolation

- **Before each test suite**: `truncateAllTables()`
- **Before each test suite**: `seedUsers()`
- **No shared state** between tests
- **Separate test database** (never dev/prod)

## CI Integration

Add to your CI pipeline:

```yaml
- name: Run E2E tests
  run: |
    createdb lms_test
    DATABASE_URL=postgresql://localhost:5432/lms_test pnpm run db:migrate
    pnpm run test:e2e
```

**Rule**: No PR merged unless `pnpm test:e2e` passes.

## Troubleshooting

### Tests fail with "Database connection error"
- Ensure test database exists
- Check `.env.test` has correct `DATABASE_URL`
- Verify PostgreSQL is running

### Tests fail with "User not found"
- Run `seedUsers()` before tests
- Check `truncateAllTables()` is called

### Tests are flaky
- Ensure `--runInBand` flag (sequential execution)
- Check for shared state between tests
- Verify database isolation

## Next Steps

Once all E2E tests pass:
1. ✅ Backend is frozen
2. ✅ API contracts locked
3. ✅ Frontend can start safely
4. ✅ No breaking changes without version bump

---

**Status**: All 6 required E2E tests implemented and ready to run.

