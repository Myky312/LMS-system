import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export class CreateCourseDto {
  @ApiProperty({ example: 'Introduction to Quran' })
  title!: string;

  @ApiProperty({
    example: 'Learn the basics of Quran recitation',
    required: false,
  })
  description?: string;
}
