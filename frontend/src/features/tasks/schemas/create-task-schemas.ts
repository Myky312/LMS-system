import { z } from "zod";

/** QUIZ: question min 1, options exactly 4 (each min 1 after trim), correctAnswer 0..3 */
export const quizConfigSchema = z.object({
  question: z.string().min(1, "Question is required").transform((s) => s.trim()),
  options: z
    .array(z.string().transform((s) => s.trim()))
    .length(4, "Exactly 4 options required")
    .refine(
      (opts) => opts.every((o) => o.length >= 1),
      "Each option must be non-empty"
    ),
  correctAnswer: z.number().int().min(0).max(3),
});

/** AUDIO: instructions optional, maxDuration optional positive int (seconds) */
export const audioConfigSchema = z.object({
  instructions: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : undefined)),
  maxDuration: z
    .number()
    .int("Must be an integer")
    .positive("Must be positive")
    .optional(),
});

/** PHOTO: instructions optional, requiredElements optional (empty elements stripped before submit) */
export const photoConfigSchema = z.object({
  instructions: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : undefined)),
  requiredElements: z
    .array(z.string().min(1).transform((s) => s.trim()))
    .optional()
    .transform((arr) =>
      arr?.filter((s) => s.length > 0)
    ),
});

export const createQuizTaskSchema = z.object({
  type: z.literal("QUIZ"),
  config: quizConfigSchema,
});
export const createAudioTaskSchema = z.object({
  type: z.literal("AUDIO"),
  config: audioConfigSchema,
});
export const createPhotoTaskSchema = z.object({
  type: z.literal("PHOTO"),
  config: photoConfigSchema,
});

export const createTaskSchema = z.discriminatedUnion("type", [
  createQuizTaskSchema,
  createAudioTaskSchema,
  createPhotoTaskSchema,
]);

export type CreateQuizTaskForm = z.infer<typeof createQuizTaskSchema>;
export type CreateAudioTaskForm = z.infer<typeof createAudioTaskSchema>;
export type CreatePhotoTaskForm = z.infer<typeof createPhotoTaskSchema>;
export type CreateTaskForm = z.infer<typeof createTaskSchema>;
