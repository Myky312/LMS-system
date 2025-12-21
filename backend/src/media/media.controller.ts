import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { PresignUrlDto, presignUrlSchema } from './dto/presign-url.dto';
import { PresignUrlResponseDto } from './dto/presign-url-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/dto/zod-validation.pipe';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get presigned URL for direct S3 upload' })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated',
    type: PresignUrlResponseDto,
  })
  async getPresignedUrl(
    @Body(new ZodValidationPipe(presignUrlSchema)) presignUrlDto: PresignUrlDto,
  ) {
    return this.mediaService.getPresignedUrl(presignUrlDto);
  }
}
