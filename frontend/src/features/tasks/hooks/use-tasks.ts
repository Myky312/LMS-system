"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTasks,
  fetchTask,
  createTask,
  type CreateTaskPayload,
} from "../api/tasks-api";

export const tasksKeys = {
  all: ["tasks"] as const,
  list: (lessonId: string) => [...tasksKeys.all, lessonId] as const,
  detail: (lessonId: string, taskId: string) =>
    [...tasksKeys.all, lessonId, taskId] as const,
};

export function useTasksQuery(lessonId: string | null) {
  return useQuery({
    queryKey: tasksKeys.list(lessonId ?? ""),
    queryFn: () => fetchTasks(lessonId!),
    enabled: !!lessonId,
  });
}

export function useTaskQuery(
  lessonId: string | null,
  taskId: string | null
) {
  return useQuery({
    queryKey: tasksKeys.detail(lessonId ?? "", taskId ?? ""),
    queryFn: () => fetchTask(lessonId!, taskId!),
    enabled: !!lessonId && !!taskId,
  });
}

export function useCreateTaskMutation(lessonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(lessonId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKeys.list(lessonId) });
    },
  });
}
