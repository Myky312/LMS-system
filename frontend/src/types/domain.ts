/**
 * Domain types aligned with backend. No any.
 */

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export type CurrentUser = {
  userId: string;
  email: string;
  role: UserRole;
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
};

export type Module = {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
};

export type Lesson = {
  id: string;
  moduleId: string;
  title: string;
  videoUrl: string | null;
  orderIndex: number;
};

export type TaskType = "QUIZ" | "AUDIO" | "PHOTO";

export type QuizTaskConfig = {
  question: string;
  options: string[];
  correctAnswer: number;
};

export type AudioTaskConfig = {
  instructions?: string;
  maxDuration?: number;
};

export type PhotoTaskConfig = {
  instructions?: string;
  requiredElements?: string[];
};

export type Task = {
  id: string;
  lessonId: string;
  type: TaskType;
  config: QuizTaskConfig | AudioTaskConfig | PhotoTaskConfig;
};

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Submission = {
  id: string;
  taskId: string;
  studentId: string;
  answer: unknown;
  status: SubmissionStatus;
  teacherFeedback: string | null;
  createdAt: string;
};

export type AppError = {
  statusCode?: number;
  error?: string;
  message: string;
  errors?: unknown;
};
