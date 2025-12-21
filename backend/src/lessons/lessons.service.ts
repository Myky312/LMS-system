import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../database/drizzle';
import { lessons } from '../database/schema';
import { eq, desc } from 'drizzle-orm';
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
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(whereConditions(lessons.deletedAt, eq(lessons.id, id)))
      .limit(1);

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  /**
   * Verify lesson ownership chain: lesson → module → course → teacher
   */
  async verifyOwnership(lessonId: string, teacherId: string): Promise<void> {
    const lesson = await this.findOne(lessonId);
    await this.modulesService.verifyOwnership(lesson.moduleId, teacherId);
  }
}
