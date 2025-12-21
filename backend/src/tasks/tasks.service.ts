import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../database/drizzle';
import { tasks, lessons, modules, courses } from '../database/schema';
import { eq } from 'drizzle-orm';
import { CreateTaskDto } from './dto/create-task.dto';
import { validateTaskConfig } from './validators/task-config.validator';
import { LessonsService } from '../lessons/lessons.service';
import { whereConditions, notDeleted } from '../common/utils/soft-delete.util';

@Injectable()
export class TasksService {
  constructor(private readonly lessonsService: LessonsService) {}

  async create(
    lessonId: string,
    createTaskDto: CreateTaskDto,
    teacherId: string,
  ) {
    // Verify lesson exists and teacher owns it (explicit ownership chain check)
    await this.verifyLessonOwnership(lessonId, teacherId);

    // Strict validation - reject invalid config immediately
    validateTaskConfig(createTaskDto.type, createTaskDto.config);

    const [task] = await db
      .insert(tasks)
      .values({
        lessonId,
        type: createTaskDto.type,
        config: createTaskDto.config,
      })
      .returning();

    return task;
  }

  async findAll(lessonId: string) {
    return db
      .select()
      .from(tasks)
      .where(whereConditions(tasks.deletedAt, eq(tasks.lessonId, lessonId)));
  }

  async findOne(id: string) {
    const [task] = await db
      .select()
      .from(tasks)
      .where(whereConditions(tasks.deletedAt, eq(tasks.id, id)))
      .limit(1);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  /**
   * Verify ownership chain: task → lesson → module → course → teacher
   * Throws ForbiddenException if teacher doesn't own the course
   */
  async verifyTaskOwnership(taskId: string, teacherId: string): Promise<void> {
    const task = await this.findOne(taskId);
    await this.verifyLessonOwnership(task.lessonId, teacherId);
  }

  /**
   * Verify lesson ownership chain: lesson → module → course → teacher
   */
  private async verifyLessonOwnership(
    lessonId: string,
    teacherId: string,
  ): Promise<void> {
    // Get lesson with full ownership chain (non-deleted)
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(whereConditions(lessons.deletedAt, eq(lessons.id, lessonId)))
      .limit(1);

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Get module (non-deleted)
    const [module] = await db
      .select()
      .from(modules)
      .where(
        whereConditions(modules.deletedAt, eq(modules.id, lesson.moduleId)),
      )
      .limit(1);

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Get course and verify ownership (non-deleted)
    const [course] = await db
      .select()
      .from(courses)
      .where(
        whereConditions(courses.deletedAt, eq(courses.id, module.courseId)),
      )
      .limit(1);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.createdBy !== teacherId) {
      throw new ForbiddenException(
        'You can only create tasks in your own courses',
      );
    }
  }
}
