import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { courses } from './courses';

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id),
  title: text('title').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
