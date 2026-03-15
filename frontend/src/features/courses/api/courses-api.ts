import { authApi } from "@/lib/api/axios-client";
import type { Course } from "@/types/domain";

export type CreateCoursePayload = { title: string; description?: string };

export async function fetchCourses(): Promise<Course[]> {
  const { data } = await authApi.get<Course[]>("/courses");
  return data;
}

export async function fetchCourse(id: string): Promise<Course> {
  const { data } = await authApi.get<Course>(`/courses/${id}`);
  return data;
}

export async function createCourse(payload: CreateCoursePayload): Promise<Course> {
  const { data } = await authApi.post<Course>("/courses", payload);
  return data;
}
