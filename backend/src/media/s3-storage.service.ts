import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from './storage.interface';

@Injectable()
export class S3StorageService
  implements StorageProvider, OnModuleInit, OnModuleDestroy
{
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3StorageService.name);

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('s3.region') ?? 'us-east-1';
    const endpoint =
      this.configService.get<string>('s3.endpoint') ??
      this.configService.get<string>('S3_ENDPOINT');

    // При кастомном endpoint (MinIO) всегда path-style, иначе SDK строит bucket.endpoint (virtual-host) и падает с ENOTFOUND
    const rawForcePathStyle =
      this.configService.get<string | boolean>('s3.forcePathStyle') ??
      this.configService.get<string | boolean>('S3_FORCE_PATH_STYLE');
    const forcePathStyle = endpoint
      ? true
      : rawForcePathStyle === true || rawForcePathStyle === 'true';

    const accessKeyId =
      this.configService.get<string>('s3.accessKeyId') ??
      this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey =
      this.configService.get<string>('s3.secretAccessKey') ??
      this.configService.get<string>('S3_SECRET_KEY');

    this.bucket = this.configService.get<string>('s3.bucket') ?? 'lms-media';

    this.logger.log(
      `S3 config: endpoint=${endpoint ?? '(none)'}, bucket=${this.bucket}, forcePathStyle=${String(forcePathStyle)}`,
    );

    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    const endpoint = this.configService.get<string>('s3.endpoint');
    const maxAttempts = endpoint ? 5 : 1;
    const delayMs = 2000;
    if (endpoint) {
      const msg = `[S3StorageService] Ensuring bucket "${this.bucket}" exists (up to ${maxAttempts} attempts)`;
      this.logger.log(msg);
      console.log(msg);
      await new Promise((r) => setTimeout(r, 1500));
    }
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const ok = await this.ensureBucketExists();
      if (ok) break;
      if (attempt < maxAttempts) {
        this.logger.warn(
          `Bucket ${this.bucket} not ready (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  /** Create the configured bucket if it does not exist (e.g. MinIO on first run). Returns true if bucket exists. */
  private async ensureBucketExists(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`S3 bucket exists: ${this.bucket}`);
      return true;
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'name' in err
          ? (err as { name?: string }).name
          : null;
      const statusCode =
        err && typeof err === 'object' && '$metadata' in err
          ? (err as { $metadata?: { httpStatusCode?: number } }).$metadata
              ?.httpStatusCode
          : null;
      if (code === 'NotFound' || statusCode === 404) {
        try {
          await this.client.send(
            new CreateBucketCommand({ Bucket: this.bucket }),
          );
          const createdMsg = `S3 bucket created: ${this.bucket}`;
          this.logger.log(createdMsg);
          console.log(`[S3StorageService] ${createdMsg}`);
          return true;
        } catch (createErr) {
          const errMsg = `Failed to create bucket ${this.bucket}: ${String(createErr)}`;
          this.logger.warn(errMsg);
          console.warn(`[S3StorageService] ${errMsg}`);
          return false;
        }
      }
      const errMsg = `Could not ensure bucket ${this.bucket} exists: ${String(err)}`;
      this.logger.warn(errMsg);
      console.warn(`[S3StorageService] ${errMsg}`);
      return false;
    }
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileKey: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 300,
    });

    return {
      uploadUrl,
      fileKey: key,
    };
  }
}
