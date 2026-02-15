import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { login, getAuthHeaders, testUsers } from './utils/auth';
import { truncateAllTables, seedUsers } from './utils/db-setup';
import type { ApiResourceId, SubmissionResponse } from './utils/api-types';
import { db, pool } from '../src/database/drizzle';
import { taskSubmissions } from '../src/database/schema';
import { eq } from 'drizzle-orm';

describe('Submissions Idempotency & Transaction Rollback (e2e)', () => {
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

    // Create course structure
    const courseRes = await request(app.getHttpServer())
      .post('/api/v1/courses')
      .set(getAuthHeaders(teacherToken))
      .send({ title: 'Test Course' })
      .expect(201);
    courseId = (courseRes.body as ApiResourceId).id;

    const moduleRes = await request(app.getHttpServer())
      .post(`/api/v1/courses/${courseId}/modules`)
      .set(getAuthHeaders(teacherToken))
      .send({ title: 'Module 1' })
      .expect(201);
    moduleId = (moduleRes.body as ApiResourceId).id;

    const lessonRes = await request(app.getHttpServer())
      .post(`/api/v1/modules/${moduleId}/lessons`)
      .set(getAuthHeaders(teacherToken))
      .send({ title: 'Lesson 1' })
      .expect(201);
    lessonId = (lessonRes.body as ApiResourceId).id;

    // Create task
    const taskRes = await request(app.getHttpServer())
      .post(`/api/v1/lessons/${lessonId}/tasks`)
      .set(getAuthHeaders(teacherToken))
      .send({
        type: 'AUDIO',
        config: { instructions: 'Record audio' },
      })
      .expect(201);
    taskId = (taskRes.body as ApiResourceId).id;
  });

  it('Duplicate submission → 400 (idempotency)', async () => {
    // First submission succeeds
    const response1 = await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { audioUrl: 'test.mp3' } })
      .expect(201);

    const submissionId1 = (response1.body as ApiResourceId).id;

    // Second submission fails
    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { audioUrl: 'test2.mp3' } })
      .expect(400);

    // Verify only one submission exists in DB
    const submissions = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, taskId));

    expect(submissions).toHaveLength(1);
    expect(submissions[0].id).toBe(submissionId1);
  });

  it('Invalid quiz answer → transaction rollback (no submission inserted)', async () => {
    // Create quiz task
    const quizTaskRes = await request(app.getHttpServer())
      .post(`/api/v1/lessons/${lessonId}/tasks`)
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

    const quizTaskId = (quizTaskRes.body as ApiResourceId).id;

    // Count submissions before
    const beforeCount = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, quizTaskId));

    expect(beforeCount).toHaveLength(0);

    // Submit invalid answer (out of bounds)
    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${quizTaskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { selectedOption: 999 } })
      .expect(400);

    // Verify NO submission was inserted
    const afterCount = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, quizTaskId));

    expect(afterCount).toHaveLength(0);
  });

  it('Valid quiz submission → transaction commits (submission inserted)', async () => {
    // Create quiz task
    const quizTaskRes = await request(app.getHttpServer())
      .post(`/api/v1/lessons/${lessonId}/tasks`)
      .set(getAuthHeaders(teacherToken))
      .send({
        type: 'QUIZ',
        config: {
          question: 'Test?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 2,
        },
      })
      .expect(201);

    const quizTaskId = (quizTaskRes.body as ApiResourceId).id;

    // Submit valid answer
    const response = await request(app.getHttpServer())
      .post(`/api/v1/tasks/${quizTaskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { selectedOption: 2 } })
      .expect(201);

    // Verify submission was inserted
    const submissions = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.taskId, quizTaskId));

    expect(submissions).toHaveLength(1);
    expect(submissions[0].id).toBe((response.body as SubmissionResponse).id);
    expect(submissions[0].status).toBe('APPROVED'); // Auto-graded
  });
});
