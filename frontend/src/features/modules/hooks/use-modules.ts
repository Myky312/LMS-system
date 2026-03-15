"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchModulesByCourse,
  createModule,
  type CreateModulePayload,
} from "../api/modules-api";
import { coursesKeys } from "@/features/courses/hooks/use-courses";

export const modulesKeys = {
  all: ["modules"] as const,
  list: (courseId: string) => [...modulesKeys.all, courseId] as const,
};

export function useModulesQuery(courseId: string | null) {
  return useQuery({
    queryKey: modulesKeys.list(courseId ?? ""),
    queryFn: () => fetchModulesByCourse(courseId!),
    enabled: !!courseId,
  });
}

export function useCreateModuleMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateModulePayload) => createModule(courseId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: modulesKeys.list(courseId) });
      qc.invalidateQueries({ queryKey: coursesKeys.all });
    },
  });
}
