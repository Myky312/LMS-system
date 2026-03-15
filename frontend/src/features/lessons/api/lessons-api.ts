import { authApi } from "@/lib/api/axios-client";
import type { Lesson } from "@/types/domain";

export type CreateLessonPayload = {
  title: string;
  videoUrl?: string;
};

export async function fetchLessons(moduleId: string): Promise<Lesson[]> {
  const { data } = await authApi.get<Lesson[]>(`/modules/${moduleId}/lessons`);
  return data;
}

export async function fetchLesson(moduleId: string, lessonId: string): Promise<Lesson> {
  const { data } = await authApi.get<Lesson>(`/modules/${moduleId}/lessons/${lessonId}`);
  return data;
}

export async function createLesson(
  moduleId: string,
  payload: CreateLessonPayload
): Promise<Lesson> {
  const { data } = await authApi.post<Lesson>(`/modules/${moduleId}/lessons`, payload);
  return data;
}
