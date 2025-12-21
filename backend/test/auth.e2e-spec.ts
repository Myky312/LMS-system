import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/test-app';
import { truncateAllTables, seedUsers } from './utils/db-setup';
import { testUsers } from './utils/auth';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await truncateAllTables();
    await seedUsers();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Login with valid credentials → 200 with tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testUsers.teacherA.email,
        password: testUsers.teacherA.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testUsers.teacherA.email);
  });

  it('Login with invalid credentials → 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testUsers.teacherA.email,
        password: 'wrongpassword',
      })
      .expect(401);
  });

  it('Access protected route without token → 401', async () => {
    await request(app.getHttpServer()).get('/api/courses').expect(401);
  });

  it('Access protected route with invalid token → 401', async () => {
    await request(app.getHttpServer())
      .get('/api/courses')
      .set({ Authorization: 'Bearer invalid_token' })
      .expect(401);
  });
});

