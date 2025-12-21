import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { PresignUrlDto } from './dto/presign-url.dto';

@Injectable()
export class MediaService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const s3Config: AWS.S3.ClientConfiguration = {
      region: this.configService.get<string>('s3.region'),
      accessKeyId: this.configService.get<string>('s3.accessKeyId'),
      secretAccessKey: this.configService.get<string>('s3.secretAccessKey'),
    };

    // For MinIO or custom S3-compatible endpoints
    const endpoint = this.configService.get<string>('s3.endpoint');
    if (endpoint) {
      s3Config.endpoint = endpoint;
      s3Config.s3ForcePathStyle = true;
    }

    this.s3 = new AWS.S3(s3Config);
    this.bucket = this.configService.get<string>('s3.bucket') || 'lms-media';
  }

  async getPresignedUrl(presignUrlDto: PresignUrlDto) {
    const fileExtension = presignUrlDto.fileName.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `uploads/${uniqueFileName}`;

    const params: AWS.S3.PresignedPost.Params = {
      Bucket: this.bucket,
      Fields: {
        key,
        'Content-Type': presignUrlDto.contentType,
      },
      Conditions: [
        ['content-length-range', 0, 100 * 1024 * 1024], // Max 100MB
        ['eq', '$Content-Type', presignUrlDto.contentType],
      ],
      Expires: 3600, // 1 hour
    };

    return new Promise<{ uploadUrl: string; fileUrl: string }>(
      (resolve, reject) => {
        this.s3.createPresignedPost(params, (err, data) => {
          if (err) {
            reject(err);
            return;
          }

          // For presigned POST, we return the form data URL and fields
          // The client will POST to data.url with data.fields
          const formData = new URLSearchParams();
          Object.entries(data.fields).forEach(([key, value]) => {
            formData.append(key, value);
          });

          resolve({
            uploadUrl: data.url,
            fileUrl: `s3://${this.bucket}/${key}`,
          });
        });
      },
    );
  }
}
