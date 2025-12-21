import { Injectable, BadRequestException } from '@nestjs/common';
import { SubmissionStatus } from '../../common/enums';

/**
 * Centralized quiz grading function
 * DO NOT trust client - always verify against task config
 *
 * This is the SINGLE SOURCE OF TRUTH for quiz grading logic
 */
export interface QuizGradingResult {
  isCorrect: boolean;
  score: number; // 0 or 1 for binary grading
  status: SubmissionStatus;
}

export interface QuizConfig {
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-3
}

export interface QuizSubmissionAnswer {
  selectedOption?: number;
  answer?: number; // Alternative field name
}

@Injectable()
export class QuizGraderService {
  /**
   * Grade a quiz submission deterministically
   *
   * Rules:
   * - Must NOT trust client
   * - Compare against taskConfig.correctAnswer
   * - Correct → APPROVED
   * - Incorrect → REJECTED
   *
   * @param taskConfig - The task's config (validated QuizConfig)
   * @param submissionAnswer - The student's answer
   * @returns Grading result with status
   */
  gradeQuiz(
    taskConfig: QuizConfig,
    submissionAnswer: QuizSubmissionAnswer,
  ): QuizGradingResult {
    // Extract selected option (support both field names)
    const selectedOption =
      submissionAnswer.selectedOption ?? submissionAnswer.answer;

    // Validate input
    if (typeof selectedOption !== 'number') {
      throw new BadRequestException(
        'Quiz submission must include selectedOption (number)',
      );
    }

    if (!Number.isInteger(selectedOption)) {
      throw new BadRequestException('selectedOption must be an integer');
    }

    if (selectedOption < 0 || selectedOption >= taskConfig.options.length) {
      throw new BadRequestException(
        `selectedOption must be between 0 and ${taskConfig.options.length - 1}`,
      );
    }

    // Deterministic grading: compare against correctAnswer
    const isCorrect = selectedOption === taskConfig.correctAnswer;
    const score = isCorrect ? 1 : 0;

    // Auto-set status based on correctness
    const status = isCorrect
      ? SubmissionStatus.APPROVED
      : SubmissionStatus.REJECTED;

    return {
      isCorrect,
      score,
      status,
    };
  }

  /**
   * Validate that a task config is a valid QuizConfig
   * Used before grading to ensure type safety
   */
  validateQuizConfig(config: unknown): config is QuizConfig {
    if (typeof config !== 'object' || config === null) {
      return false;
    }

    const c = config as Record<string, unknown>;

    return (
      typeof c.question === 'string' &&
      Array.isArray(c.options) &&
      c.options.length === 4 &&
      c.options.every((opt: unknown) => typeof opt === 'string') &&
      typeof c.correctAnswer === 'number' &&
      Number.isInteger(c.correctAnswer) &&
      c.correctAnswer >= 0 &&
      c.correctAnswer < 4
    );
  }
}
