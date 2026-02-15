import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { truncateAllTables, seedUsers } from './utils/db-setup';
import { testUsers } from './utils/auth';
import type { LoginResponse } from './utils/api-types';
import { pool } from '../src/database/drizzle';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await truncateAllTables();
    await seedUsers();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('Login with valid credentials → 200 with tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testUsers.teacherA.email,
        password: testUsers.teacherA.password,
      })
      .expect(200);

    const body = response.body as LoginResponse;
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe(testUsers.teacherA.email);
  });

  it('Login with invalid credentials → 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testUsers.teacherA.email,
        password: 'wrongpassword',
      })
      .expect(401);
  });

  it('Access protected route without token → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/courses').expect(401);
  });

  it('Access protected route with invalid token → 401', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/courses')
      .set({ Authorization: 'Bearer invalid_token' })
      .expect(401);
  });
});
