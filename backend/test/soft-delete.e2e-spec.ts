import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { login, getAuthHeaders, testUsers } from './utils/auth';
import { truncateAllTables, seedUsers } from './utils/db-setup';
import type { ApiResourceId, CourseListItem } from './utils/api-types';
import { db, pool } from '../src/database/drizzle';
import { courses, modules, tasks } from '../src/database/schema';
import { eq } from 'drizzle-orm';

describe('Soft Delete (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let studentToken: string;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;
  let taskId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await truncateAllTables();
    await seedUsers();

    teacherToken = await login(
      app,
      testUsers.teacherA.email,
      testUsers.teacherA.password,
    );
    studentToken = await login(
      app,
      testUsers.student.email,
      testUsers.student.password,
    );
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  beforeEach(async () => {
    await truncateAllTables();
    await seedUsers();

    teacherToken = await login(
      app,
      testUsers.teacherA.email,
      testUsers.teacherA.password,
    );
    studentToken = await login(
      app,
      testUsers.student.email,
      testUsers.student.password,
    );

    // Create full course structure
    const courseRes = await request(app.getHttpServer())
      .post('/api/courses')
      .set(getAuthHeaders(teacherToken))
      .send({ title: 'Test Course', description: 'Test' })
      .expect(201);
    courseId = (courseRes.body as ApiResourceId).id;

    const moduleRes = await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/modules`)
      .set(getAuthHeaders(teacherToken))
      .send({ title: 'Module 1' })
      .expect(201);
    moduleId = (moduleRes.body as ApiResourceId).id;

    const lessonRes = await request(app.getHttpServer())
      .post(`/api/modules/${moduleId}/lessons`)
      .set(getAuthHeaders(teacherToken))
      .send({ title: 'Lesson 1' })
      .expect(201);
    lessonId = (lessonRes.body as ApiResourceId).id;

    const taskRes = await request(app.getHttpServer())
      .post(`/api/lessons/${lessonId}/tasks`)
      .set(getAuthHeaders(teacherToken))
      .send({
        type: 'QUIZ',
        config: {
          question: 'Test?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
        },
      })
      .expect(201);
    taskId = (taskRes.body as ApiResourceId).id;
  });

  it('Soft delete course → course not in list', async () => {
    // Verify course exists
    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}`)
      .set(getAuthHeaders(teacherToken))
      .expect(200);

    // Soft delete course (using direct DB update for now)
    await db
      .update(courses)
      .set({ deletedAt: new Date() })
      .where(eq(courses.id, courseId));

    // Course should not appear in list
    const listRes = await request(app.getHttpServer())
      .get('/api/courses')
      .set(getAuthHeaders(teacherToken))
      .expect(200);

    const listBody = listRes.body as CourseListItem[];
    const courseIds = listBody.map((c) => c.id);
    expect(courseIds).not.toContain(courseId);

    // Direct access should return 404
    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}`)
      .set(getAuthHeaders(teacherToken))
      .expect(404);
  });

  it('Soft delete course → child invisibility (module/lesson/task)', async () => {
    // Soft delete course
    await db
      .update(courses)
      .set({ deletedAt: new Date() })
      .where(eq(courses.id, courseId));

    // Module should not be accessible
    await request(app.getHttpServer())
      .get(`/api/modules/${moduleId}`)
      .set(getAuthHeaders(teacherToken))
      .expect(404);

    // Lesson should not be accessible
    await request(app.getHttpServer())
      .get(`/api/modules/${moduleId}/lessons`)
      .set(getAuthHeaders(teacherToken))
      .expect(404);

    // Task should not be accessible
    await request(app.getHttpServer())
      .get(`/api/lessons/${lessonId}/tasks/${taskId}`)
      .set(getAuthHeaders(teacherToken))
      .expect(404);
  });

  it('Soft delete task → student cannot submit', async () => {
    // Verify task exists
    await request(app.getHttpServer())
      .get(`/api/lessons/${lessonId}/tasks/${taskId}`)
      .set(getAuthHeaders(teacherToken))
      .expect(200);

    // Soft delete task
    await db
      .update(tasks)
      .set({ deletedAt: new Date() })
      .where(eq(tasks.id, taskId));

    // Student cannot submit to deleted task
    await request(app.getHttpServer())
      .post(`/api/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { selectedOption: 0 } })
      .expect(404);
  });

  it('Soft delete module → lessons not accessible', async () => {
    // Soft delete module
    await db
      .update(modules)
      .set({ deletedAt: new Date() })
      .where(eq(modules.id, moduleId));

    // Module should not be accessible
    await request(app.getHttpServer())
      .get(`/api/modules/${moduleId}`)
      .set(getAuthHeaders(teacherToken))
      .expect(404);

    // Lesson should not be accessible (module deleted)
    await request(app.getHttpServer())
      .get(`/api/modules/${moduleId}/lessons`)
      .set(getAuthHeaders(teacherToken))
      .expect(404);

    // Cannot create new lesson in deleted module
    await request(app.getHttpServer())
      .post(`/api/modules/${moduleId}/lessons`)
      .set(getAuthHeaders(teacherToken))
      .send({ title: 'New Lesson' })
      .expect(404);
  });

  it('Teacher B cannot access Teacher A deleted course → 404 (not 403)', async () => {
    // Soft delete course
    await db
      .update(courses)
      .set({ deletedAt: new Date() })
      .where(eq(courses.id, courseId));

    const teacherBToken = await login(
      app,
      testUsers.teacherB.email,
      testUsers.teacherB.password,
    );

    // Teacher B tries to access deleted course → 404 (not 403)
    // This proves soft delete hides data from everyone, not just owner
    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}`)
      .set(getAuthHeaders(teacherBToken))
      .expect(404);
  });
});
