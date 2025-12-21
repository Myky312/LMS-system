import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createModuleSchema = z.object({
  title: z.string().min(1),
  orderIndex: z.number().int().min(0).optional(),
});

export class CreateModuleDto {
  @ApiProperty({ example: 'Module 1: Basics' })
  title!: string;

  @ApiProperty({ example: 0, required: false })
  orderIndex?: number;
}
