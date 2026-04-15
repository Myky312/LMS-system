import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { API_BASE_URL } from "@/lib/constants/env";
import { authHeaders } from "@/lib/api/auth-headers";
import { getSessionUser } from "@/lib/auth/session";
import { isTeacherOrAdmin } from "@/lib/auth/roles";
import { BrowseBreadcrumb } from "@/components/browse/BrowseBreadcrumb";

type CourseDetail = { id: string; title: string };
type ModuleRow = { id: string; title: string; courseId: string };
type LessonRow = {
  id: string;
  moduleId: string;
  title: string;
  videoUrl?: string | null;
  orderIndex: number;
};

export function ModuleLessonsPage() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const user = getSessionUser();
  const canManage = isTeacherOrAdmin(user);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [moduleRow, setModuleRow] = useState<ModuleRow | null>(null);
  const [lessons, setLessons] = useState<LessonRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedLessons = useMemo(
    () => (lessons ? [...lessons].sort((a, b) => a.orderIndex - b.orderIndex) : []),
    [lessons]
  );

  useEffect(() => {
    if (!courseId || !moduleId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    const headers = authHeaders();

    Promise.all([
      axios.get<CourseDetail>(`${API_BASE_URL}/courses/${courseId}`, { headers }),
      axios.get<ModuleRow>(`${API_BASE_URL}/courses/${courseId}/modules/${moduleId}`, { headers }),
      axios.get<LessonRow[]>(`${API_BASE_URL}/modules/${moduleId}/lessons`, { headers }),
    ])
      .then(([cRes, modRes, lRes]) => {
        if (!cancelled) {
          setCourse(cRes.data);
          setModuleRow(modRes.data);
          setLessons(lRes.data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось загрузить модуль.");
          setCourse(null);
          setModuleRow(null);
          setLessons([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, moduleId]);

  if (!courseId || !moduleId) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 960, margin: "0 auto" }}>
      <BrowseBreadcrumb
        items={[
          { to: "/courses", label: "Курсы" },
          { to: `/courses/${courseId}`, label: course?.title ?? "Курс" },
          { label: moduleRow?.title ?? "Модуль" },
        ]}
      />

      {loading && (
        <div className="flex justify-content-center py-6">
          <ProgressSpinner style={{ width: 48, height: 48 }} strokeWidth="4" />
        </div>
      )}

      {!loading && error && <Message severity="warn" text={error} className="w-full mb-4" />}

      {!loading && !error && moduleRow && (
        <>
          <div className="flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-3xl m-0">{moduleRow.title}</h1>
              <p className="text-color-secondary mt-2 mb-0">Уроки в этом модуле</p>
            </div>
            {canManage && (
              <Button
                label="Добавить урок"
                icon="pi pi-plus"
                type="button"
                onClick={() => navigate(`/modules/${moduleId}/lessons/new`)}
              />
            )}
          </div>

          {sortedLessons.length === 0 ? (
            <Card title="Пока нет уроков">
              <p className="text-color-secondary m-0">
                {canManage
                  ? "Добавьте урок, затем прикрепите тесты и другие задания."
                  : "Уроков пока нет."}
              </p>
            </Card>
          ) : (
            <ul className="list-none p-0 m-0 flex flex-column gap-3">
              {sortedLessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    to={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
                    className="no-underline"
                    style={{ color: "inherit" }}
                  >
                    <Card
                      title={lesson.title}
                      className="hover:surface-hover transition-colors transition-duration-150"
                    >
                      <div className="flex flex-column gap-2">
                        <p className="text-color-secondary text-sm m-0">
                          Урок · порядок {lesson.orderIndex}
                        </p>
                        {lesson.videoUrl && (
                          <a
                            href={lesson.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Открыть видео
                          </a>
                        )}
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
