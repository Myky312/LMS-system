import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3StorageService } from './s3-storage.service';
import { AuthModule } from '../auth/auth.module';
import s3Config from '../config/s3.config';

@Module({
  imports: [ConfigModule.forFeature(s3Config), AuthModule],
  controllers: [MediaController],
  providers: [S3StorageService, MediaService],
  exports: [MediaService],
})
export class MediaModule {}
