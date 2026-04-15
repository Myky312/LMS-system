import { Injectable } from '@nestjs/common';
import { and, count, eq, gte, lt } from 'drizzle-orm';
import { db } from '../database/drizzle';
import {
  courses,
  lessons,
  modules,
  taskSubmissions,
  tasks,
  users,
} from '../database/schema';
import { notDeleted } from '../common/utils/soft-delete.util';
import { SubmissionStatus, UserRole } from '../common/enums';

@Injectable()
export class DashboardService {
  async getOverview(userId: string, role: string) {
    if (role === (UserRole.ADMIN as string)) {
      return this.getOverviewAdmin();
    }
    if (role === (UserRole.TEACHER as string)) {
      return this.getOverviewTeacher(userId);
    }
    return this.getOverviewStudent(userId);
  }

  private async getOverviewAdmin() {
    const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(users);

    const [{ totalCourses }] = await db
      .select({ totalCourses: count() })
      .from(courses)
      .where(notDeleted(courses.deletedAt));

    const [{ totalModules }] = await db
      .select({ totalModules: count() })
      .from(modules)
      .where(notDeleted(modules.deletedAt));

    const [{ totalLessons }] = await db
      .select({ totalLessons: count() })
      .from(lessons)
      .where(notDeleted(lessons.deletedAt));

    const [{ totalSubmissions }] = await db
      .select({ totalSubmissions: count() })
      .from(taskSubmissions)
      .where(notDeleted(taskSubmissions.deletedAt));

    const [{ approvedSubmissions }] = await db
      .select({ approvedSubmissions: count() })
      .from(taskSubmissions)
      .where(
        and(
          notDeleted(taskSubmissions.deletedAt),
          eq(taskSubmissions.status, SubmissionStatus.APPROVED),
        ),
      );

    const startThisMonth = new Date();
    startThisMonth.setUTCDate(1);
    startThisMonth.setUTCHours(0, 0, 0, 0);
    const startPrevMonth = new Date(startThisMonth);
    startPrevMonth.setUTCMonth(startPrevMonth.getUTCMonth() - 1);

    const [{ newThisMonth }] = await db
      .select({ newThisMonth: count() })
      .from(users)
      .where(gte(users.createdAt, startThisMonth));

    const [{ newPrevMonth }] = await db
      .select({ newPrevMonth: count() })
      .from(users)
      .where(
        and(gte(users.createdAt, startPrevMonth), lt(users.createdAt, startThisMonth)),
      );

    const tu = Number(totalUsers ?? 0);
    const npm = Number(newPrevMonth ?? 0);
    const usersTrendPercent =
      npm > 0
        ? Math.round(((Number(newThisMonth ?? 0) - npm) / npm) * 100)
        : Number(newThisMonth ?? 0) > 0
          ? 100
          : 0;

    const ts = Number(totalSubmissions ?? 0);
    const approvalPercent =
      ts > 0
        ? Math.round((Number(approvedSubmissions ?? 0) / ts) * 100)
        : 0;

    return {
      role: UserRole.ADMIN,
      totalUsers: tu,
      totalCourses: Number(totalCourses ?? 0),
      totalModules: Number(totalModules ?? 0),
      totalLessons: Number(totalLessons ?? 0),
      totalSubmissions: ts,
      usersTrendPercent,
      coursesActiveLabel: Number(totalCourses ?? 0) > 0 ? 'Активны' : undefined,
      submissionApprovalPercent: approvalPercent,
    };
  }

  private async getOverviewTeacher(teacherId: string) {
    const [{ totalCourses }] = await db
      .select({ totalCourses: count() })
      .from(courses)
      .where(
        and(notDeleted(courses.deletedAt), eq(courses.createdBy, teacherId)),
      );

    const [{ totalModules }] = await db
      .select({ totalModules: count() })
      .from(modules)
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          notDeleted(modules.deletedAt),
          notDeleted(courses.deletedAt),
          eq(courses.createdBy, teacherId),
        ),
      );

    const [{ totalSubmissions }] = await db
      .select({ totalSubmissions: count() })
      .from(taskSubmissions)
      .innerJoin(tasks, eq(taskSubmissions.taskId, tasks.id))
      .innerJoin(lessons, eq(tasks.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          notDeleted(taskSubmissions.deletedAt),
          notDeleted(tasks.deletedAt),
          notDeleted(lessons.deletedAt),
          notDeleted(modules.deletedAt),
          notDeleted(courses.deletedAt),
          eq(courses.createdBy, teacherId),
        ),
      );

    const [{ approvedSubmissions }] = await db
      .select({ approvedSubmissions: count() })
      .from(taskSubmissions)
      .innerJoin(tasks, eq(taskSubmissions.taskId, tasks.id))
      .innerJoin(lessons, eq(tasks.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          notDeleted(taskSubmissions.deletedAt),
          notDeleted(tasks.deletedAt),
          notDeleted(lessons.deletedAt),
          notDeleted(modules.deletedAt),
          notDeleted(courses.deletedAt),
          eq(courses.createdBy, teacherId),
          eq(taskSubmissions.status, SubmissionStatus.APPROVED),
        ),
      );

    const [{ totalLessons }] = await db
      .select({ totalLessons: count() })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(
        and(
          notDeleted(lessons.deletedAt),
          notDeleted(modules.deletedAt),
          notDeleted(courses.deletedAt),
          eq(courses.createdBy, teacherId),
        ),
      );

    const tc = Number(totalCourses ?? 0);
    const ts = Number(totalSubmissions ?? 0);
    const approvalPercent =
      ts > 0
        ? Math.round((Number(approvedSubmissions ?? 0) / ts) * 100)
        : 0;

    return {
      role: UserRole.TEACHER,
      totalUsers: null as number | null,
      totalCourses: tc,
      totalModules: Number(totalModules ?? 0),
      totalLessons: Number(totalLessons ?? 0),
      totalSubmissions: ts,
      usersTrendPercent: null as number | null,
      coursesActiveLabel: tc > 0 ? 'Активны' : undefined,
      submissionApprovalPercent: approvalPercent,
    };
  }

  private async getOverviewStudent(studentId: string) {
    const [{ totalCourses }] = await db
      .select({ totalCourses: count() })
      .from(courses)
      .where(notDeleted(courses.deletedAt));

    const [{ totalModules }] = await db
      .select({ totalModules: count() })
      .from(modules)
      .where(notDeleted(modules.deletedAt));

    const [{ totalLessons }] = await db
      .select({ totalLessons: count() })
      .from(lessons)
      .where(notDeleted(lessons.deletedAt));

    const [{ totalSubmissions }] = await db
      .select({ totalSubmissions: count() })
      .from(taskSubmissions)
      .where(
        and(
          notDeleted(taskSubmissions.deletedAt),
          eq(taskSubmissions.studentId, studentId),
        ),
      );

    const [{ approvedSubmissions }] = await db
      .select({ approvedSubmissions: count() })
      .from(taskSubmissions)
      .where(
        and(
          notDeleted(taskSubmissions.deletedAt),
          eq(taskSubmissions.studentId, studentId),
          eq(taskSubmissions.status, SubmissionStatus.APPROVED),
        ),
      );

    const ts = Number(totalSubmissions ?? 0);
    const approvalPercent =
      ts > 0
        ? Math.round((Number(approvedSubmissions ?? 0) / ts) * 100)
        : 0;

    return {
      role: UserRole.STUDENT,
      totalUsers: null,
      totalCourses: Number(totalCourses ?? 0),
      totalModules: Number(totalModules ?? 0),
      totalLessons: Number(totalLessons ?? 0),
      totalSubmissions: ts,
      usersTrendPercent: null,
      coursesActiveLabel:
        Number(totalCourses ?? 0) > 0 ? 'Доступны' : undefined,
      submissionApprovalPercent: approvalPercent,
    };
  }
}
