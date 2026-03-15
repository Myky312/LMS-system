import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../database/drizzle';
import { lessons, modules, courses } from '../database/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { ModulesService } from '../modules/modules.service';
import { whereConditions, notDeleted } from '../common/utils/soft-delete.util';

@Injectable()
export class LessonsService {
  constructor(private readonly modulesService: ModulesService) {}

  /**
   * Create lesson with transaction safety
   * - Verify ownership
   * - Calculate order index
   * - Insert atomically
   */
  async create(
    moduleId: string,
    createLessonDto: CreateLessonDto,
    teacherId: string,
  ) {
    return db.transaction(async (tx) => {
      // Explicit ownership check: verify module → course → teacher
      await this.modulesService.verifyOwnership(moduleId, teacherId);

      // Get max order index (only non-deleted lessons)
      const existingLessons = await tx
        .select()
        .from(lessons)
        .where(
          whereConditions(lessons.deletedAt, eq(lessons.moduleId, moduleId)),
        )
        .orderBy(desc(lessons.orderIndex))
        .limit(1);

      const orderIndex =
        createLessonDto.orderIndex ??
        (existingLessons[0]?.orderIndex ?? -1) + 1;

      // Insert lesson atomically
      const [lesson] = await tx
        .insert(lessons)
        .values({
          moduleId,
          title: createLessonDto.title,
          videoUrl: createLessonDto.videoUrl,
          orderIndex,
        })
        .returning();

      return lesson;
    });
  }

  async findAll(moduleId: string) {
    // Verify module exists
    await this.modulesService.findOne(moduleId);

    return db
      .select()
      .from(lessons)
      .where(whereConditions(lessons.deletedAt, eq(lessons.moduleId, moduleId)))
      .orderBy(lessons.orderIndex);
  }

  async findOne(id: string) {
    // Lesson is invisible if it or its module/course is soft-deleted
    const [row] = await db
      .select({ lesson: lessons })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          eq(lessons.id, id),
          notDeleted(lessons.deletedAt),
          notDeleted(modules.deletedAt),
          notDeleted(courses.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException('Lesson not found');
    }

    return row.lesson;
  }

  /**
   * Verify lesson ownership chain: lesson → module → course → teacher
   */
  async verifyOwnership(lessonId: string, teacherId: string): Promise<void> {
    const lesson = await this.findOne(lessonId);
    await this.modulesService.verifyOwnership(lesson.moduleId, teacherId);
  }

  /**
   * Reorder lessons within a module. All ids must belong to the module.
   * Updates orderIndex in a transaction.
   */
  async reorder(
    moduleId: string,
    items: Array<{ id: string; orderIndex: number }>,
    teacherId: string,
  ) {
    await this.modulesService.verifyOwnership(moduleId, teacherId);

    const ids = items.map((i) => i.id);
    const existing = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(
        and(
          eq(lessons.moduleId, moduleId),
          notDeleted(lessons.deletedAt),
          inArray(lessons.id, ids),
        ),
      );

    if (existing.length !== ids.length) {
      throw new BadRequestException(
        'All lesson ids must belong to this module and exist',
      );
    }

    await db.transaction(async (tx) => {
      for (const { id, orderIndex } of items) {
        await tx.update(lessons).set({ orderIndex }).where(eq(lessons.id, id));
      }
    });

    return this.findAll(moduleId);
  }
}
