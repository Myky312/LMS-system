import { z } from 'zod';
import { TaskType } from '../../common/enums';
import { BadRequestException } from '@nestjs/common';

/**
 * Strict validation schemas per task type
 * Reject invalid config immediately - no silent fixes
 */

export const QuizConfigSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .length(4, 'Quiz must have exactly 4 options'),
  correctAnswer: z
    .number()
    .int('Correct answer must be an integer')
    .min(0, 'Correct answer must be between 0 and 3')
    .max(3, 'Correct answer must be between 0 and 3'),
});

export const AudioConfigSchema = z.object({
  instructions: z.string().optional(),
  maxDuration: z
    .number()
    .int('Max duration must be an integer')
    .positive('Max duration must be positive')
    .optional(),
});

export const PhotoConfigSchema = z.object({
  instructions: z.string().optional(),
  requiredElements: z
    .array(z.string().min(1, 'Required element cannot be empty'))
    .optional(),
});

/**
 * Factory function to get the correct schema based on task type
 */
export function getTaskConfigSchema(type: TaskType): z.ZodSchema {
  switch (type) {
    case TaskType.QUIZ:
      return QuizConfigSchema;
    case TaskType.AUDIO:
      return AudioConfigSchema;
    case TaskType.PHOTO:
      return PhotoConfigSchema;
    default: {
      const _exhaustive: never = type;
      throw new BadRequestException(
        `Invalid task type: ${String(_exhaustive)}`,
      );
    }
  }
}

/**
 * Validate task config and throw BadRequestException if invalid
 */
export function validateTaskConfig(type: TaskType, config: unknown): void {
  const schema = getTaskConfigSchema(type);
  const result = schema.safeParse(config);

  if (!result.success) {
    throw new BadRequestException({
      message: 'Invalid task config',
      errors: result.error.errors,
    });
  }
}
