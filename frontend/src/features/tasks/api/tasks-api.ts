import { authApi } from "@/lib/api/axios-client";
import type { Task } from "@/types/domain";

export type CreateQuizTaskPayload = {
  type: "QUIZ";
  config: { question: string; options: string[]; correctAnswer: number };
};
export type CreateAudioTaskPayload = {
  type: "AUDIO";
  config: { instructions?: string; maxDuration?: number };
};
export type CreatePhotoTaskPayload = {
  type: "PHOTO";
  config: { instructions?: string; requiredElements?: string[] };
};
export type CreateTaskPayload =
  | CreateQuizTaskPayload
  | CreateAudioTaskPayload
  | CreatePhotoTaskPayload;

export async function fetchTasks(lessonId: string): Promise<Task[]> {
  const { data } = await authApi.get<Task[]>(`/lessons/${lessonId}/tasks`);
  return data;
}

export async function fetchTask(
  lessonId: string,
  taskId: string
): Promise<Task> {
  const { data } = await authApi.get<Task>(
    `/lessons/${lessonId}/tasks/${taskId}`
  );
  return data;
}

export async function createTask(
  lessonId: string,
  payload: CreateTaskPayload
): Promise<Task> {
  const { data } = await authApi.post<Task>(
    `/lessons/${lessonId}/tasks`,
    payload
  );
  return data;
}
