import { authApi } from "@/lib/api/axios-client";
import type { Lesson } from "@/types/domain";
import type { ReorderPayload } from "@/types/domain";

export async function reorderLessons(
  moduleId: string,
  payload: ReorderPayload
): Promise<Lesson[]> {
  const { data } = await authApi.patch<Lesson[]>(
    `/modules/${moduleId}/lessons/reorder`,
    payload
  );
  return data;
}
