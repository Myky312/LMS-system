import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { truncateAllTables, seedUsers } from './utils/db-setup';
import { login, getAuthHeaders } from './utils/auth';
import { testUsers } from './utils/auth';
import { pool } from '../src/database/drizzle';

interface PresignResponse {
  uploadUrl: string;
  fileUrl: string;
}

describe('Media presign (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  // E2E runs with S3_BUCKET overridden to S3_BUCKET_TEST in setup-e2e.ts
  const testBucket = process.env.S3_BUCKET || 'baitul-quran-media-test';

  beforeAll(async () => {
    app = await createTestApp();
    await truncateAllTables();
    await seedUsers();
    accessToken = await login(
      app,
      testUsers.teacherA.email,
      testUsers.teacherA.password,
    );
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('POST /api/v1/media/presign returns uploadUrl and fileUrl', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/media/presign')
      .set(getAuthHeaders(accessToken))
      .send({
        fileName: 'audio-recording.mp3',
        contentType: 'audio/mpeg',
      })
      .expect(200);

    const body = response.body as PresignResponse;
    expect(body).toHaveProperty('uploadUrl');
    expect(body).toHaveProperty('fileUrl');
    expect(typeof body.uploadUrl).toBe('string');
    expect(typeof body.fileUrl).toBe('string');
    expect(body.uploadUrl.length).toBeGreaterThan(0);
    expect(body.fileUrl.length).toBeGreaterThan(0);
  });

  it('presign uploadUrl contains the correct bucket (test bucket in E2E)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/media/presign')
      .set(getAuthHeaders(accessToken))
      .send({
        fileName: 'test.png',
        contentType: 'image/png',
      })
      .expect(200)
      .expect((res: { body: PresignResponse }) => {
        const { uploadUrl } = res.body;
        expect(uploadUrl).toContain(testBucket);
      });
  });

  it('presign uploadUrl is signed (contains expiry/signature query params)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/media/presign')
      .set(getAuthHeaders(accessToken))
      .send({
        fileName: 'doc.pdf',
        contentType: 'application/pdf',
      })
      .expect(200)
      .expect((res: { body: PresignResponse }) => {
        const { uploadUrl } = res.body;
        expect(uploadUrl).toMatch(/X-Amz-/);
      });
  });

  it('presign fileUrl has correct key format (bucket and path)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/media/presign')
      .set(getAuthHeaders(accessToken))
      .send({
        fileName: 'recording.wav',
        contentType: 'audio/wav',
      })
      .expect(200)
      .expect((res: { body: PresignResponse }) => {
        const { fileUrl } = res.body;
        expect(fileUrl).toMatch(new RegExp(`s3://[^/]+/uploads/[^/]+\\.wav`));
      });
  });

  it('presign requires authentication', () => {
    return request(app.getHttpServer())
      .post('/api/v1/media/presign')
      .send({
        fileName: 'test.mp3',
        contentType: 'audio/mpeg',
      })
      .expect(401);
  });
});
