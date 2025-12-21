import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { tasks } from './tasks';
import { users } from './users';
import { SubmissionStatus } from '../../common/enums';

export const taskSubmissions = pgTable(
  'task_submissions',
  {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.id),
  answer: jsonb('answer').notNull(),
  status: text('status', {
    enum: [
      SubmissionStatus.PENDING,
      SubmissionStatus.APPROVED,
      SubmissionStatus.REJECTED,
    ],
  })
    .notNull()
    .default(SubmissionStatus.PENDING),
  teacherFeedback: text('teacher_feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    // Enforce idempotency: one submission per student per task
    uniqueTaskStudent: unique().on(table.taskId, table.studentId),
  }),
);

export type TaskSubmission = typeof taskSubmissions.$inferSelect;
export type NewTaskSubmission = typeof taskSubmissions.$inferInsert;
