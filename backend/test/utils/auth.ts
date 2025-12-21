import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface TestUser {
  email: string;
  password: string;
  role: string;
}

export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'ADMIN',
  },
  teacherA: {
    email: 'teachera@test.com',
    password: 'teacher123',
    role: 'TEACHER',
  },
  teacherB: {
    email: 'teacherb@test.com',
    password: 'teacher123',
    role: 'TEACHER',
  },
  student: {
    email: 'student@test.com',
    password: 'student123',
    role: 'STUDENT',
  },
};

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.accessToken;
}

export function getAuthHeaders(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}

