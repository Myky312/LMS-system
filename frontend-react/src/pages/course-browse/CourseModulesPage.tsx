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

type CourseDetail = {
  id: string;
  title: string;
  description?: string | null;
};

type ModuleRow = {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
};

export function CourseModulesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const user = getSessionUser();
  const canManage = isTeacherOrAdmin(user);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [modules, setModules] = useState<ModuleRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedModules = useMemo(
    () => (modules ? [...modules].sort((a, b) => a.orderIndex - b.orderIndex) : []),
    [modules]
  );

  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const headers = authHeaders();

    Promise.all([
      axios.get<CourseDetail>(`${API_BASE_URL}/courses/${courseId}`, { headers }),
      axios.get<ModuleRow[]>(`${API_BASE_URL}/courses/${courseId}/modules`, { headers }),
    ])
      .then(([cRes, mRes]) => {
        if (!cancelled) {
          setCourse(cRes.data);
          setModules(mRes.data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось загрузить курс. Возможно, он не существует или нет доступа.");
          setCourse(null);
          setModules([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!courseId) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 960, margin: "0 auto" }}>
      <BrowseBreadcrumb
        items={[
          { to: "/courses", label: "Курсы" },
          { label: course?.title ?? "Курс" },
        ]}
      />

      {loading && (
        <div className="flex justify-content-center py-6">
          <ProgressSpinner style={{ width: 48, height: 48 }} strokeWidth="4" />
        </div>
      )}

      {!loading && error && <Message severity="warn" text={error} className="w-full mb-4" />}

      {!loading && !error && course && (
        <>
          <div className="flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-3xl m-0">{course.title}</h1>
              {course.description && (
                <p className="text-color-secondary mt-2 mb-0">{course.description}</p>
              )}
              <p className="text-color-secondary mt-2 mb-0">
                Откройте модуль, чтобы перейти к урокам и заданиям.
              </p>
            </div>
            {canManage && (
              <Button
                label="Добавить модуль"
                icon="pi pi-folder-plus"
                type="button"
                onClick={() => navigate(`/courses/${courseId}/modules/new`)}
              />
            )}
          </div>

          {sortedModules.length === 0 ? (
            <Card title="Пока нет модулей">
              <p className="text-color-secondary m-0">
                {canManage
                  ? "Создайте модуль, чтобы добавить уроки и тесты."
                  : "В этом курсе пока нет модулей."}
              </p>
            </Card>
          ) : (
            <ul className="list-none p-0 m-0 flex flex-column gap-3">
              {sortedModules.map((m) => (
                <li key={m.id}>
                  <Link
                    to={`/courses/${courseId}/modules/${m.id}`}
                    className="no-underline"
                    style={{ color: "inherit" }}
                  >
                    <Card title={m.title} className="hover:surface-hover transition-colors transition-duration-150">
                      <p className="text-color-secondary text-sm m-0">
                        Модуль · порядок {m.orderIndex}
                      </p>
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
