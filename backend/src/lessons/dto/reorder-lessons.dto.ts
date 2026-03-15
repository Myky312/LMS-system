import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

const reorderItemSchema = z.object({
  id: z.string().uuid(),
  orderIndex: z.number().int().min(0),
});

export const reorderLessonsSchema = z.object({
  items: z.array(reorderItemSchema).min(1),
});

export class ReorderLessonsDto {
  @ApiProperty({
    example: [
      { id: 'uuid-1', orderIndex: 0 },
      { id: 'uuid-2', orderIndex: 1 },
    ],
  })
  items!: Array<{ id: string; orderIndex: number }>;
}
