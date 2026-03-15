"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLessons,
  fetchLesson,
  createLesson,
  type CreateLessonPayload,
} from "../api/lessons-api";
import { reorderLessons as reorderLessonsApi } from "../api/reorder-lessons";
import type { ReorderPayload } from "@/types/domain";

export const lessonsKeys = {
  all: ["lessons"] as const,
  list: (moduleId: string) => [...lessonsKeys.all, moduleId] as const,
  detail: (moduleId: string, lessonId: string) =>
    [...lessonsKeys.all, moduleId, lessonId] as const,
};

export function useLessonsQuery(moduleId: string | null) {
  return useQuery({
    queryKey: lessonsKeys.list(moduleId ?? ""),
    queryFn: () => fetchLessons(moduleId!),
    enabled: !!moduleId,
  });
}

export function useLessonQuery(moduleId: string | null, lessonId: string | null) {
  return useQuery({
    queryKey: lessonsKeys.detail(moduleId ?? "", lessonId ?? ""),
    queryFn: () => fetchLesson(moduleId!, lessonId!),
    enabled: !!moduleId && !!lessonId,
  });
}

export function useCreateLessonMutation(moduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLessonPayload) => createLesson(moduleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonsKeys.list(moduleId) });
    },
  });
}

export function useReorderLessonsMutation(moduleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReorderPayload) =>
      reorderLessonsApi(moduleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lessonsKeys.list(moduleId) });
      qc.invalidateQueries({ queryKey: ["module", moduleId] });
    },
  });
}
