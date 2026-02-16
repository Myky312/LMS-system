import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { LoginResponse } from './api-types';

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

const LOGIN_RETRIES = 3;
const LOGIN_RETRY_DELAY_MS = 100;

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= LOGIN_RETRIES; attempt++) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email, password });

    if (response.status === 200) {
      const body = response.body as LoginResponse;
      return body.accessToken;
    }
    if (response.status === 401 && attempt < LOGIN_RETRIES) {
      await new Promise((r) => setTimeout(r, LOGIN_RETRY_DELAY_MS));
      lastError = new Error(
        `Login 401 (attempt ${attempt}/${LOGIN_RETRIES}): ${email}`,
      );
      continue;
    }
    lastError = new Error(
      `Login failed: ${response.status} - ${JSON.stringify(response.body)}`,
    );
    break;
  }
  throw lastError ?? new Error('Login failed after retries');
}

export function getAuthHeaders(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}
