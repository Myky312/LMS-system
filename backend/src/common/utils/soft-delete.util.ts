import { SQL, and, isNull } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

/**
 * Soft delete utility functions
 *
 * Rules:
 * - Never DELETE records
 * - Always use soft delete (UPDATE deleted_at = now())
 * - Every query must filter deleted_at IS NULL
 * - Admin-only hard delete (future feature)
 */

/**
 * Filter condition to exclude soft-deleted records
 * Use in all queries: .where(and(...otherConditions, notDeleted(table.deletedAt)))
 */
export function notDeleted(deletedAtColumn: PgColumn): SQL {
  return isNull(deletedAtColumn);
}

/**
 * Helper to combine conditions with soft delete filter
 * Usage: whereConditions(table.deletedAt, eq(table.id, id), eq(table.status, 'active'))
 */
export function whereConditions(
  deletedAtColumn: PgColumn,
  ...conditions: (SQL | undefined)[]
): SQL {
  const validConditions = conditions.filter((c): c is SQL => c !== undefined);
  return and(notDeleted(deletedAtColumn), ...validConditions)!;
}
