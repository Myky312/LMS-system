import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/test-app';
import { login, getAuthHeaders, testUsers } from './utils/auth';
import { truncateAllTables, seedUsers, getUserIdByEmail } from './utils/db-setup';

describe('Ownership Violation (e2e)', () => {
  let app: INestApplication;
  let teacherAToken: string;
  let teacherBToken: string;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await truncateAllTables();
    await seedUsers();

    teacherAToken = await login(app, testUsers.teacherA.email, testUsers.teacherA.password);
    teacherBToken = await login(app, testUsers.teacherB.email, testUsers.teacherB.password);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables();
    await seedUsers();

    teacherAToken = await login(app, testUsers.teacherA.email, testUsers.teacherA.password);
    teacherBToken = await login(app, testUsers.teacherB.email, testUsers.teacherB.password);

    // Teacher A creates course
    const courseRes = await request(app.getHttpServer())
      .post('/api/courses')
      .set(getAuthHeaders(teacherAToken))
      .send({ title: 'Teacher A Course', description: 'Test course' })
      .expect(201);

    courseId = courseRes.body.id;

    // Teacher A creates module
    const moduleRes = await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/modules`)
      .set(getAuthHeaders(teacherAToken))
      .send({ title: 'Module 1' })
      .expect(201);

    moduleId = moduleRes.body.id;

    // Teacher A creates lesson
    const lessonRes = await request(app.getHttpServer())
      .post(`/api/modules/${moduleId}/lessons`)
      .set(getAuthHeaders(teacherAToken))
      .send({ title: 'Lesson 1' })
      .expect(201);

    lessonId = lessonRes.body.id;
  });

  it('Teacher B cannot create module in Teacher A course → 403', async () => {
    await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/modules`)
      .set(getAuthHeaders(teacherBToken))
      .send({ title: 'Unauthorized Module' })
      .expect(403);
  });

  it('Teacher B cannot create lesson in Teacher A module → 403', async () => {
    await request(app.getHttpServer())
      .post(`/api/modules/${moduleId}/lessons`)
      .set(getAuthHeaders(teacherBToken))
      .send({ title: 'Unauthorized Lesson' })
      .expect(403);
  });

  it('Teacher B cannot create task in Teacher A lesson → 403', async () => {
    await request(app.getHttpServer())
      .post(`/api/lessons/${lessonId}/tasks`)
      .set(getAuthHeaders(teacherBToken))
      .send({
        type: 'QUIZ',
        config: {
          question: 'Test?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
        },
      })
      .expect(403);
  });

  it('Teacher B cannot access Teacher A course → 403', async () => {
    await request(app.getHttpServer())
      .get(`/api/courses/${courseId}`)
      .set(getAuthHeaders(teacherBToken))
      .expect(403);
  });

  it('Teacher B cannot review submissions for Teacher A course → 403', async () => {
    // Create a submission first (student submits)
    const studentToken = await login(app, testUsers.student.email, testUsers.student.password);

    // Create task first
    const taskRes = await request(app.getHttpServer())
      .post(`/api/lessons/${lessonId}/tasks`)
      .set(getAuthHeaders(teacherAToken))
      .send({
        type: 'AUDIO',
        config: { instructions: 'Record audio' },
      })
      .expect(201);

    const taskId = taskRes.body.id;

    // Student submits
    const submissionRes = await request(app.getHttpServer())
      .post(`/api/tasks/${taskId}/submit`)
      .set(getAuthHeaders(studentToken))
      .send({ answer: { audioUrl: 'test.mp3' } })
      .expect(201);

    const submissionId = submissionRes.body.id;

    // Teacher B tries to review → should fail
    await request(app.getHttpServer())
      .patch(`/api/submissions/${submissionId}/review`)
      .set(getAuthHeaders(teacherBToken))
      .send({ status: 'APPROVED', feedback: 'Good' })
      .expect(403);
  });
});

