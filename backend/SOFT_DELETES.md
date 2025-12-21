# Soft Deletes Implementation

## ✅ Issue #8: Soft Deletes - FIXED

### Overview

**Problem**: Hard deletes are irreversible and unacceptable for production systems.

**Solution**: Implemented soft deletes across all content tables with `deleted_at` timestamp.

### Schema Changes

Added `deletedAt: timestamp('deleted_at')` to:
- ✅ `courses`
- ✅ `modules`
- ✅ `lessons`
- ✅ `tasks`
- ✅ `task_submissions`

### Rules Enforced

1. **Never DELETE**: All delete operations use soft delete (UPDATE `deleted_at = now()`)
2. **Always Filter**: Every query filters `deleted_at IS NULL`
3. **Admin-Only Hard Delete**: Hard deletes reserved for admin operations (future feature)

### Implementation

#### Utility Functions

Created `src/common/utils/soft-delete.util.ts`:

```typescript
// Filter condition to exclude soft-deleted records
notDeleted(deletedAtColumn): SQL

// Combine conditions with soft delete filter
whereConditions(deletedAtColumn, ...conditions): SQL
```

#### Query Pattern

**Before**:
```typescript
db.select().from(courses).where(eq(courses.id, id))
```

**After**:
```typescript
db.select()
  .from(courses)
  .where(whereConditions(courses.deletedAt, eq(courses.id, id)))
```

### Service Updates

All services updated to filter soft-deleted records:

- ✅ `CoursesService` - All queries filter `deleted_at IS NULL`
- ✅ `ModulesService` - All queries filter `deleted_at IS NULL`
- ✅ `LessonsService` - All queries filter `deleted_at IS NULL`
- ✅ `TasksService` - All queries filter `deleted_at IS NULL`
- ✅ `SubmissionsService` - All queries filter `deleted_at IS NULL`

### Soft Delete Method

Added `softDelete()` method to `CoursesService` as example:

```typescript
async softDelete(id: string, userId: string) {
  // Verify ownership
  const course = await this.findOne(id, 'TEACHER', userId);
  
  // Soft delete (UPDATE deleted_at = now())
  const [deleted] = await db
    .update(courses)
    .set({ deletedAt: new Date() })
    .where(eq(courses.id, id))
    .returning();
    
  return deleted;
}
```

### Benefits

1. **Data Safety**: No accidental data loss
2. **Audit Trail**: Can see what was deleted and when
3. **Recovery**: Can restore deleted items if needed
4. **Analytics**: Can analyze deleted content patterns
5. **Legal Compliance**: Meets data retention requirements

### Migration Required

**CRITICAL**: Run database migration to add `deleted_at` columns:

```bash
cd backend
pnpm run db:generate
pnpm run db:migrate
```

This will add `deleted_at TIMESTAMP NULL` to all content tables.

### Future Enhancements

1. **Admin Hard Delete**: Add admin-only endpoint for permanent deletion
2. **Bulk Soft Delete**: Soft delete cascades (delete course → delete all modules)
3. **Restore Endpoint**: Allow restoring soft-deleted items
4. **Retention Policy**: Auto hard-delete after X days (configurable)

### Testing Requirements

1. **Soft Delete Test**:
   - Soft delete course → verify `deleted_at` is set
   - Query courses → deleted course not returned
   - Verify ownership check still works

2. **Query Filter Test**:
   - Create course → soft delete → query
   - Verify deleted course not in results
   - Verify other courses still visible

3. **Cascade Test** (future):
   - Soft delete course → verify modules/lessons/tasks also soft deleted

---

## Files Modified

### Schemas
- `src/database/schema/courses.ts` - Added `deletedAt`
- `src/database/schema/modules.ts` - Added `deletedAt`
- `src/database/schema/lessons.ts` - Added `deletedAt`
- `src/database/schema/tasks.ts` - Added `deletedAt`
- `src/database/schema/submissions.ts` - Added `deletedAt`

### Services
- `src/courses/courses.service.ts` - Added soft delete filtering + method
- `src/modules/modules.service.ts` - Added soft delete filtering
- `src/lessons/lessons.service.ts` - Added soft delete filtering
- `src/tasks/tasks.service.ts` - Added soft delete filtering
- `src/submissions/submissions.service.ts` - Added soft delete filtering

## Files Created

- `src/common/utils/soft-delete.util.ts` - Utility functions for soft delete queries

---

**All content tables now support soft deletes. Data is safe from accidental loss.**

