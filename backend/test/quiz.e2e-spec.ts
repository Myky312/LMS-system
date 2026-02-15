import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { login, getAuthHeaders, testUsers } from './utils/auth';
import { truncateAllTables, seedUsers } from './utils/db-setup';
import type { ApiResourceId, SubmissionResponse } from './utils/api-types';
import { pool } from '../src/database/drizzle';

describe('Quiz Auto-Grading (e2e)', () => {
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
      .send({ title: 'Quiz Course' })
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

    // Create quiz task
    const taskRes = await request(app.getHttpServer())
      .post(`/api/v1/lessons/${lessonId}/tasks`)
      .set(getAuthHeaders(teacherToken))
      .send({
        type: 'QUIZ',
        config: {
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1, // Index 1 = "4"
        },
      })
      .expect(201);
    taskId = (taskRes.body as ApiResourceId).id;
  });

  it('Correct answer → status APPROVED', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { selectedOption: 1 } })
      .expect(201);

    expect((response.body as SubmissionResponse).status).toBe('APPROVED');
  });

  it('Incorrect answer → status REJECTED', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { selectedOption: 0 } }) // Wrong answer
      .expect(201);

    expect((response.body as SubmissionResponse).status).toBe('REJECTED');
  });

  it('Invalid selectedOption (out of bounds) → 422', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { selectedOption: 999 } })
      .expect(400);
  });

  it('Missing selectedOption → 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: {} })
      .expect(400);
  });

  it('Grading is deterministic (same answer = same result)', async () => {
    // Submit correct answer twice (second will fail due to idempotency, but first should be APPROVED)
    const response1 = await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { selectedOption: 1 } })
      .expect(201);

    expect((response1.body as SubmissionResponse).status).toBe('APPROVED');

    // Try to submit again (should fail due to idempotency)
    await request(app.getHttpServer())
      .post(`/api/v1/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { selectedOption: 1 } })
      .expect(400);
  });
});
