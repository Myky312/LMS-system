import { authApi } from "@/lib/api/axios-client";
import type { Module } from "@/types/domain";
import type { ReorderPayload } from "@/types/domain";

export async function reorderModules(
  courseId: string,
  payload: ReorderPayload
): Promise<Module[]> {
  const { data } = await authApi.patch<Module[]>(
    `/courses/${courseId}/modules/reorder`,
    payload
  );
  return data;
}
