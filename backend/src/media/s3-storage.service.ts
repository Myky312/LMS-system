import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from './storage.interface';

@Injectable()
export class S3StorageService implements StorageProvider, OnModuleDestroy {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('s3.region') ?? 'us-east-1';
    const endpoint = this.configService.get<string>('s3.endpoint');
    const forcePathStyle =
      this.configService.get<string>('s3.forcePathStyle') === 'true';
    const accessKeyId = this.configService.get<string>('s3.accessKeyId');
    const secretAccessKey =
      this.configService.get<string>('s3.secretAccessKey');

    this.client = new S3Client({
      region,
      ...(endpoint && { endpoint }),
      forcePathStyle: forcePathStyle,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });

    this.bucket = this.configService.get<string>('s3.bucket') ?? 'lms-media';
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
