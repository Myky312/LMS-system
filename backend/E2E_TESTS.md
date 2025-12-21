# E2E Tests Implementation

## ✅ Issue #13: E2E Tests - IMPLEMENTED

### Test Infrastructure

**Created**:
- `test/utils/test-app.ts` - Test app factory
- `test/utils/auth.ts` - Auth helpers and test users
- `test/utils/db-setup.ts` - Database isolation utilities
- `test/setup-e2e.ts` - Test environment setup
- `.env.test` - Test environment variables

### Test Files

1. **`test/auth.e2e-spec.ts`** - Authentication tests
2. **`test/ownership.e2e-spec.ts`** - Ownership violation tests
3. **`test/quiz.e2e-spec.ts`** - Quiz auto-grading tests
4. **`test/submissions.e2e-spec.ts`** - Submission idempotency & transaction rollback
5. **`test/soft-delete.e2e-spec.ts`** - Soft delete visibility tests

### Required Tests Implemented

#### ✅ TEST 1: Ownership Violation → 403/404

**File**: `test/ownership.e2e-spec.ts`

**Scenarios**:
- Teacher B cannot create module in Teacher A course → 403
- Teacher B cannot create lesson in Teacher A module → 403
- Teacher B cannot create task in Teacher A lesson → 403
- Teacher B cannot access Teacher A course → 403
- Teacher B cannot review submissions for Teacher A course → 403

**Validation**: All ownership checks enforced at service level

---

#### ✅ TEST 2: Quiz Auto-Grading

**File**: `test/quiz.e2e-spec.ts`

**Scenarios**:
- Correct answer → status APPROVED
- Incorrect answer → status REJECTED
- Invalid selectedOption (out of bounds) → 422
- Missing selectedOption → 400
- Grading is deterministic (same answer = same result)

**Validation**: 
- Centralized `QuizGraderService` used
- No client trust
- Status set server-side

---

#### ✅ TEST 3: Submission Idempotency

**File**: `test/submissions.e2e-spec.ts`

**Scenarios**:
- Duplicate submission → 400
- Verify only one submission exists in DB
- DB constraint UNIQUE(task_id, student_id) enforced

**Validation**: 
- Application-level check
- DB constraint as safety net
- No duplicate submissions possible

---

#### ✅ TEST 4: Soft Delete Hides Data

**File**: `test/soft-delete.e2e-spec.ts`

**Scenarios**:
- Soft delete course → course not in list
- Direct access to deleted course → 404
- Soft delete task → student cannot submit
- Soft delete module → lessons not accessible

**Validation**: 
- All queries filter `deleted_at IS NULL`
- Deleted content invisible to all users

---

#### ✅ TEST 5: Child Invisibility After Parent Delete

**File**: `test/soft-delete.e2e-spec.ts`

**Scenarios**:
- Delete course → module/lesson/task not accessible
- Delete module → lessons not accessible
- Cannot create new content in deleted parent

**Validation**: 
- Ownership chain checks include soft delete filtering
- No "ghost content" accessible

---

#### ✅ TEST 6: Transaction Rollback

**File**: `test/submissions.e2e-spec.ts`

**Scenarios**:
- Invalid quiz answer → 422, NO submission inserted
- Valid quiz submission → transaction commits, submission inserted
- Direct DB query to verify row count

**Validation**: 
- Transactions work correctly
- Rollback on error
- Commit on success

### Database Isolation

**Rules**:
- `truncateAllTables()` called before each test suite
- `seedUsers()` re-seeds test users
- No shared state between tests
- Test database separate from dev/prod

### Test Users

Pre-seeded users:
- `admin@test.com` / `admin123` - ADMIN role
- `teachera@test.com` / `teacher123` - TEACHER role
- `teacherb@test.com` / `teacher123` - TEACHER role
- `student@test.com` / `student123` - STUDENT role

### Running Tests

```bash
cd backend

# Set up test database first
createdb lms_test  # or use your DB tool

# Run migrations on test DB
DATABASE_URL=postgresql://user:password@localhost:5432/lms_test pnpm run db:migrate

# Run E2E tests
pnpm run test:e2e
```

### CI Rule

**package.json**:
```json
"test:e2e": "cross-env NODE_ENV=test jest --config ./test/jest-e2e.json --runInBand"
```

**Rule**: No PR merged unless `pnpm test:e2e` passes.

### Test Coverage

**What's Tested**:
- ✅ Authentication & authorization
- ✅ Ownership enforcement
- ✅ Quiz auto-grading logic
- ✅ Submission idempotency
- ✅ Soft delete visibility
- ✅ Transaction rollback
- ✅ Child invisibility after parent delete

**What's NOT Tested** (future):
- Media presigned URLs (requires S3 setup)
- Refresh token flow
- Bulk operations
- Performance/load

---

## Files Created

### Test Infrastructure
- `test/utils/test-app.ts`
- `test/utils/auth.ts`
- `test/utils/db-setup.ts`
- `test/setup-e2e.ts`
- `.env.test`

### Test Files
- `test/auth.e2e-spec.ts`
- `test/ownership.e2e-spec.ts`
- `test/quiz.e2e-spec.ts`
- `test/submissions.e2e-spec.ts`
- `test/soft-delete.e2e-spec.ts`

## Files Modified

- `package.json` - Added `test:e2e` script with `--runInBand`
- `test/jest-e2e.json` - Added setup file and timeout

---

**All 6 required E2E tests implemented. Backend correctness is now automatically verified.**

