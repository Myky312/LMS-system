import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createLessonSchema = z.object({
  title: z.string().min(1),
  videoUrl: z.string().url().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export class CreateLessonDto {
  @ApiProperty({ example: 'Lesson 1: Introduction' })
  title!: string;

  @ApiProperty({ example: 'https://example.com/video.mp4', required: false })
  videoUrl?: string;

  @ApiProperty({ example: 0, required: false })
  orderIndex?: number;
}
