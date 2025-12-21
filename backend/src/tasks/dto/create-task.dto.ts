import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../../common/enums';

// Quiz config schema
const quizConfigSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.number().int().min(0),
});

// Audio config schema
const audioConfigSchema = z.object({
  instructions: z.string().optional(),
  maxDuration: z.number().int().positive().optional(), // in seconds
});

// Photo config schema
const photoConfigSchema = z.object({
  instructions: z.string().optional(),
  requiredElements: z.array(z.string()).optional(),
});

// Polymorphic task config
const taskConfigSchema = z.union([
  quizConfigSchema,
  audioConfigSchema,
  photoConfigSchema,
]);

export const createTaskSchema = z.object({
  type: z.enum([TaskType.QUIZ, TaskType.AUDIO, TaskType.PHOTO]),
  config: taskConfigSchema,
});

export class CreateTaskDto {
  @ApiProperty({ enum: TaskType, example: TaskType.QUIZ })
  type!: TaskType;

  @ApiProperty({
    example: {
      question: 'What is the first surah?',
      options: ['Al-Fatiha', 'Al-Baqarah', 'Al-Imran'],
      correctAnswer: 0,
    },
    description: 'Config varies by task type',
  })
  config!: Record<string, unknown>;
}
