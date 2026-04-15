import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/constants/env";
import { authHeaders } from "@/lib/api/auth-headers";

export type OutlineTask = { id: string; lessonId: string; type: string };
export type OutlineLesson = {
  id: string;
  moduleId: string;
  title: string;
  orderIndex: number;
  tasks: OutlineTask[];
};
export type OutlineModule = {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  lessons: OutlineLesson[];
};

export type CourseOutlineData = {
  courseTitle: string;
  modules: OutlineModule[];
};

export function useCourseOutline(courseId: string | undefined) {
  const [data, setData] = useState<CourseOutlineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setData(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const headers = authHeaders();

    type Mod = { id: string; courseId: string; title: string; orderIndex: number };
    type Les = { id: string; moduleId: string; title: string; orderIndex: number };

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [courseRes, modulesRes] = await Promise.all([
          axios.get<{ title: string }>(`${API_BASE_URL}/courses/${courseId}`, { headers }),
          axios.get<Mod[]>(`${API_BASE_URL}/courses/${courseId}/modules`, { headers }),
        ]);

        const modules = [...(modulesRes.data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);

        const modulesWithLessons: OutlineModule[] = await Promise.all(
          modules.map(async (m) => {
            const lesRes = await axios.get<Les[]>(`${API_BASE_URL}/modules/${m.id}/lessons`, {
              headers,
            });
            const lessons = [...(lesRes.data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);

            const lessonsWithTasks: OutlineLesson[] = await Promise.all(
              lessons.map(async (l) => {
                const tRes = await axios.get<OutlineTask[]>(
                  `${API_BASE_URL}/lessons/${l.id}/tasks`,
                  { headers }
                );
                return {
                  id: l.id,
                  moduleId: l.moduleId,
                  title: l.title,
                  orderIndex: l.orderIndex,
                  tasks: tRes.data ?? [],
                };
              })
            );

            return {
              id: m.id,
              courseId: m.courseId,
              title: m.title,
              orderIndex: m.orderIndex,
              lessons: lessonsWithTasks,
            };
          })
        );

        if (!cancelled) {
          setData({
            courseTitle: courseRes.data.title,
            modules: modulesWithLessons,
          });
        }
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить структуру курса.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return { data, loading, error };
}
