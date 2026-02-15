import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3StorageService } from './s3-storage.service';
import { PresignUrlDto } from './dto/presign-url.dto';

function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

@Injectable()
export class MediaService {
  private readonly bucket: string;

  constructor(
    private readonly storage: S3StorageService,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('s3.bucket') ?? 'lms-media';
  }

  async getPresignedUrl(
    presignUrlDto: PresignUrlDto,
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const fileExtension = presignUrlDto.fileName.split('.').pop() || '';
    const uniqueFileName = `${generateUUID()}.${fileExtension}`;
    const key = `uploads/${uniqueFileName}`;

    const { uploadUrl, fileKey } = await this.storage.getPresignedUploadUrl(
      key,
      presignUrlDto.contentType,
    );

    return {
      uploadUrl,
      fileUrl: `s3://${this.bucket}/${fileKey}`,
    };
  }
}
