import { authApi } from "@/lib/api/axios-client";
import type { Module } from "@/types/domain";

export type CreateModulePayload = { title: string; orderIndex?: number };

export async function fetchModulesByCourse(courseId: string): Promise<Module[]> {
  const { data } = await authApi.get<Module[]>(`/courses/${courseId}/modules`);
  return data;
}

export async function createModule(courseId: string, payload: CreateModulePayload): Promise<Module> {
  const { data } = await authApi.post<Module>(`/courses/${courseId}/modules`, payload);
  return data;
}
