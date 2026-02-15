import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../database/drizzle';
import { courses } from '../database/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UserRole } from '../common/enums';
import { whereConditions, notDeleted } from '../common/utils/soft-delete.util';

@Injectable()
export class CoursesService {
  async create(createCourseDto: CreateCourseDto, userId: string) {
    const [course] = await db
      .insert(courses)
      .values({
        title: createCourseDto.title,
        description: createCourseDto.description,
        createdBy: userId,
      })
      .returning();

    return course;
  }

  async findAll(userRole: string, userId?: string) {
    if (userRole === (UserRole.ADMIN as string)) {
      return db
        .select()
        .from(courses)
        .where(notDeleted(courses.deletedAt))
        .orderBy(desc(courses.createdAt));
    }

    if (userRole === (UserRole.TEACHER as string)) {
      return db
        .select()
        .from(courses)
        .where(
          whereConditions(courses.deletedAt, eq(courses.createdBy, userId!)),
        )
        .orderBy(desc(courses.createdAt));
    }

    // Students can view all courses (non-deleted)
    return db
      .select()
      .from(courses)
      .where(notDeleted(courses.deletedAt))
      .orderBy(desc(courses.createdAt));
  }

  async findOne(id: string, userRole: string, userId?: string) {
    const [course] = await db
      .select()
      .from(courses)
      .where(whereConditions(courses.deletedAt, eq(courses.id, id)))
      .limit(1);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Teachers can only access their own courses (unless admin)
    if (
      userRole === (UserRole.TEACHER as string) &&
      course.createdBy !== userId
    ) {
      throw new ForbiddenException('You can only access your own courses');
    }

    return course;
  }

  /**
   * Soft delete a course (never hard delete)
   * Sets deleted_at = now() instead of DELETE
   */
  async softDelete(id: string, userId: string) {
    // Verify ownership
    await this.findOne(id, 'TEACHER', userId);

    const [deleted] = await db
      .update(courses)
      .set({ deletedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();

    return deleted;
  }
}
