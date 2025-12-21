import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const presignUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

export class PresignUrlDto {
  @ApiProperty({ example: 'audio-recording.mp3' })
  fileName!: string;

  @ApiProperty({ example: 'audio/mpeg' })
  contentType!: string;
}
