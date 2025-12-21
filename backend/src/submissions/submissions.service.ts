import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../database/drizzle';
import {
  taskSubmissions,
  tasks,
  lessons,
  modules,
  courses,
} from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { TaskType, SubmissionStatus } from '../common/enums';
import { QuizGraderService } from '../tasks/grading/quiz-grader.service';
import { whereConditions, notDeleted } from '../common/utils/soft-delete.util';

@Injectable()
export class SubmissionsService {
  constructor(private readonly quizGrader: QuizGraderService) {}

  /**
   * Submit a task with transaction safety
   * - Check idempotency
   * - Auto-grade quizzes
   * - Insert submission atomically
   */
  async submit(
    taskId: string,
    submitTaskDto: SubmitTaskDto,
    studentId: string,
  ) {
    return db.transaction(async (tx) => {
      // Verify task exists (non-deleted)
      const [task] = await tx
        .select()
        .from(tasks)
        .where(whereConditions(tasks.deletedAt, eq(tasks.id, taskId)))
        .limit(1);

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Check if submission already exists (idempotency check, non-deleted)
      // Note: DB constraint UNIQUE(task_id, student_id) will also enforce this
      const [existing] = await tx
        .select()
        .from(taskSubmissions)
        .where(
          whereConditions(
            taskSubmissions.deletedAt,
            eq(taskSubmissions.taskId, taskId),
            eq(taskSubmissions.studentId, studentId),
          ),
        )
        .limit(1);

      if (existing) {
        throw new BadRequestException(
          'Submission already exists for this task. One submission per student per task.',
        );
      }

      // Auto-grade quiz tasks using centralized grader
      let status = SubmissionStatus.PENDING;
      if (task.type === TaskType.QUIZ) {
        if (!this.quizGrader.validateQuizConfig(task.config)) {
          throw new BadRequestException('Invalid quiz task configuration');
        }

        const gradingResult = this.quizGrader.gradeQuiz(
          task.config as {
            question: string;
            options: string[];
            correctAnswer: number;
          },
          submitTaskDto.answer as { selectedOption?: number; answer?: number },
        );

        status = gradingResult.status;
      }

      // Insert submission atomically
      const [submission] = await tx
        .insert(taskSubmissions)
        .values({
          taskId,
          studentId,
          answer: submitTaskDto.answer,
          status,
        })
        .returning();

      return submission;
    });
  }

  async findAll(status?: SubmissionStatus, teacherId?: string) {
    // If teacher, filter by their courses
    if (teacherId) {
      const allSubmissions = await db
        .select({
          submission: taskSubmissions,
        })
        .from(taskSubmissions)
        .innerJoin(tasks, eq(taskSubmissions.taskId, tasks.id))
        .innerJoin(lessons, eq(tasks.lessonId, lessons.id))
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .innerJoin(courses, eq(modules.courseId, courses.id))
        .where(
          status
            ? and(
                notDeleted(taskSubmissions.deletedAt),
                notDeleted(tasks.deletedAt),
                notDeleted(lessons.deletedAt),
                notDeleted(modules.deletedAt),
                notDeleted(courses.deletedAt),
                eq(taskSubmissions.status, status),
                eq(courses.createdBy, teacherId),
              )
            : and(
                notDeleted(taskSubmissions.deletedAt),
                notDeleted(tasks.deletedAt),
                notDeleted(lessons.deletedAt),
                notDeleted(modules.deletedAt),
                notDeleted(courses.deletedAt),
                eq(courses.createdBy, teacherId),
              ),
        );

      return allSubmissions.map((s) => s.submission);
    }

    // Admin or no filter (non-deleted only)
    if (status) {
      return db
        .select()
        .from(taskSubmissions)
        .where(
          whereConditions(
            taskSubmissions.deletedAt,
            eq(taskSubmissions.status, status),
          ),
        );
    }

    return db
      .select()
      .from(taskSubmissions)
      .where(notDeleted(taskSubmissions.deletedAt));
  }

  async findOne(id: string) {
    const [submission] = await db
      .select()
      .from(taskSubmissions)
      .where(
        whereConditions(taskSubmissions.deletedAt, eq(taskSubmissions.id, id)),
      )
      .limit(1);

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return submission;
  }

  /**
   * Review a submission with transaction safety
   * - Verify ownership
   * - Enforce status transitions
   * - Update status + feedback atomically
   */
  async review(id: string, reviewDto: ReviewSubmissionDto, teacherId: string) {
    return db.transaction(async (tx) => {
      const submission = await this.findOne(id);

      // Verify teacher owns the course (explicit ownership chain, non-deleted)
      const [task] = await tx
        .select()
        .from(tasks)
        .where(
          whereConditions(tasks.deletedAt, eq(tasks.id, submission.taskId)),
        )
        .limit(1);
      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const [lesson] = await tx
        .select()
        .from(lessons)
        .where(
          whereConditions(lessons.deletedAt, eq(lessons.id, task.lessonId)),
        )
        .limit(1);
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      const [module] = await tx
        .select()
        .from(modules)
        .where(
          whereConditions(modules.deletedAt, eq(modules.id, lesson.moduleId)),
        )
        .limit(1);
      if (!module) {
        throw new NotFoundException('Module not found');
      }

      const [course] = await tx
        .select()
        .from(courses)
        .where(
          whereConditions(courses.deletedAt, eq(courses.id, module.courseId)),
        )
        .limit(1);
      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Explicit ownership check: course.created_by === teacher.id
      if (course.createdBy !== teacherId) {
        throw new ForbiddenException(
          'You can only review submissions for your own courses',
        );
      }

      // Enforce status transition: PENDING → APPROVED | REJECTED (no backwards)
      if (submission.status !== SubmissionStatus.PENDING) {
        throw new BadRequestException(
          'Can only review submissions with PENDING status',
        );
      }

      // Update status + feedback atomically
      const [updated] = await tx
        .update(taskSubmissions)
        .set({
          status: reviewDto.status,
          teacherFeedback: reviewDto.feedback,
        })
        .where(eq(taskSubmissions.id, id))
        .returning();

      return updated;
    });
  }
}
