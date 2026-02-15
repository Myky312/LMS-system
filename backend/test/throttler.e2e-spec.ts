import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { getOptionsToken, getStorageToken } from '@nestjs/throttler';
import type { Server } from 'http';
import { AppModule } from '../src/app.module';
import { IpThrottlerGuard } from '../src/common/guards/ip-throttler.guard';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { pool } from '../src/database/drizzle';

/** Lower limit in e2e so we hit 429 in a few requests; ttl in ms (60s window). */
const E2E_THROTTLER_OPTIONS = {
  throttlers: [{ ttl: 60_000, limit: 2 }],
};

async function createThrottlerTestApp(): Promise<INestApplication> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- getOptionsToken from @nestjs/throttler
  const optionsToken = getOptionsToken();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- getStorageToken from @nestjs/throttler
  const storageToken = getStorageToken();
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(optionsToken)
    .useValue(E2E_THROTTLER_OPTIONS)
    .compile();

  const app = moduleFixture.createNestApplication();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- token from @nestjs/throttler
  const options = moduleFixture.get(optionsToken);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- token from @nestjs/throttler
  const storage = moduleFixture.get(storageToken);
  const reflector = moduleFixture.get(Reflector);
  const guard = new IpThrottlerGuard(options, storage, reflector);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- ThrottlerGuard lifecycle
  await guard.onModuleInit();
  app.useGlobalGuards(guard);
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
  return app;
}

describe('Throttler (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createThrottlerTestApp();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('global limit: 3rd request to /api/v1/health returns 429', async () => {
    const server = app.getHttpServer() as Server;
    await request(server).get('/api/v1/health').expect(200);
    await request(server).get('/api/v1/health').expect(200);
    await request(server).get('/api/v1/health').expect(429);
  });

  it('login limit: 6th attempt with invalid creds returns 429', async () => {
    const server = app.getHttpServer() as Server;
    // Login has @Throttle({ default: { limit: 5, ttl: 60_000 } }) so 5 allowed, 6th returns 429
    const payload = {
      email: 'fake@test.com',
      password: 'wrongpw',
    };
    for (let i = 0; i < 5; i++) {
      await request(server)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(401);
    }
    await request(server)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(429);
  });
});
