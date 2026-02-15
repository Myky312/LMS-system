import { registerAs } from '@nestjs/config';

/**
 * S3-compatible storage (AWS S3 or MinIO).
 * MinIO: set S3_ENDPOINT and S3_FORCE_PATH_STYLE=true.
 * AWS S3: leave S3_ENDPOINT empty and S3_FORCE_PATH_STYLE=false.
 */
export default registerAs('s3', () => ({
  region: process.env.S3_REGION || 'us-east-1',
  bucket: process.env.S3_BUCKET || 'lms-media',
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
}));
