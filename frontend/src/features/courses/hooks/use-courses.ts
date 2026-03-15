"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCourses,
  fetchCourse,
  createCourse,
  type CreateCoursePayload,
} from "../api/courses-api";

export const coursesKeys = {
  all: ["courses"] as const,
  list: () => [...coursesKeys.all, "list"] as const,
  detail: (id: string) => [...coursesKeys.all, "detail", id] as const,
};

export function useCoursesQuery() {
  return useQuery({
    queryKey: coursesKeys.list(),
    queryFn: fetchCourses,
  });
}

export function useCourseQuery(courseId: string | null) {
  return useQuery({
    queryKey: coursesKeys.detail(courseId ?? ""),
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
  });
}

export function useCreateCourseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCoursePayload) => createCourse(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coursesKeys.all });
    },
  });
}
