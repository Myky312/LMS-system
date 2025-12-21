import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { lessons } from './lessons';
import { TaskType } from '../../common/enums';

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id),
  type: text('type', {
    enum: [TaskType.QUIZ, TaskType.AUDIO, TaskType.PHOTO],
  }).notNull(),
  config: jsonb('config').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
