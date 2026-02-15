import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../database/drizzle';
import { modules, courses } from '../database/schema';
import { eq, desc, and } from 'drizzle-orm';
import { CreateModuleDto } from './dto/create-module.dto';
import { CoursesService } from '../courses/courses.service';
import { whereConditions, notDeleted } from '../common/utils/soft-delete.util';

@Injectable()
export class ModulesService {
  constructor(private readonly coursesService: CoursesService) {}

  async create(
    courseId: string,
    createModuleDto: CreateModuleDto,
    userId: string,
  ) {
    // Explicit ownership check: verify course exists and user owns it
    await this.coursesService.findOne(courseId, 'TEACHER', userId);

    // Get max order index (only non-deleted modules)
    const existingModules = await db
      .select()
      .from(modules)
      .where(whereConditions(modules.deletedAt, eq(modules.courseId, courseId)))
      .orderBy(desc(modules.orderIndex))
      .limit(1);

    const orderIndex =
      createModuleDto.orderIndex ?? (existingModules[0]?.orderIndex ?? -1) + 1;

    const [module] = await db
      .insert(modules)
      .values({
        courseId,
        title: createModuleDto.title,
        orderIndex,
      })
      .returning();

    return module;
  }

  async findAll(courseId: string) {
    // Verify course exists
    await this.coursesService.findOne(courseId, 'STUDENT');

    return db
      .select()
      .from(modules)
      .where(whereConditions(modules.deletedAt, eq(modules.courseId, courseId)))
      .orderBy(modules.orderIndex);
  }

  async findOne(id: string) {
    // Module is invisible if it or its course is soft-deleted (child invisibility)
    const [row] = await db
      .select({ module: modules })
      .from(modules)
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          eq(modules.id, id),
          notDeleted(modules.deletedAt),
          notDeleted(courses.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException('Module not found');
    }

    return row.module;
  }

  /**
   * Verify module ownership chain: module → course → teacher
   * Throws ForbiddenException if teacher doesn't own the course
   */
  async verifyOwnership(moduleId: string, teacherId: string): Promise<void> {
    const module = await this.findOne(moduleId);
    const course = await this.coursesService.findOne(
      module.courseId,
      'TEACHER',
      teacherId,
    );

    if (course.createdBy !== teacherId) {
      throw new ForbiddenException(
        'You can only access modules in your own courses',
      );
    }
  }
}
