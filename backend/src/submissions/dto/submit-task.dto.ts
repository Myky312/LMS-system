import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const submitTaskSchema = z.object({
  answer: z.record(z.unknown()),
});

export class SubmitTaskDto {
  @ApiProperty({
    example: { selectedOption: 0 },
    description: 'Answer format varies by task type',
  })
  answer!: Record<string, unknown>;
}
