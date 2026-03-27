import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { API_BASE_URL } from "@/lib/constants/env";
import { authHeaders } from "@/lib/api/auth-headers";
import { getSessionUser } from "@/lib/auth/session";
import { isTeacherOrAdmin } from "@/lib/auth/roles";
import { BrowseBreadcrumb } from "@/components/browse/BrowseBreadcrumb";

type CourseDetail = { id: string; title: string };
type ModuleRow = { id: string; title: string };
type LessonRow = {
  id: string;
  title: string;
  moduleId: string;
  videoUrl?: string | null;
};
type TaskRow = {
  id: string;
  lessonId: string;
  type: string;
  config: unknown;
  createdAt?: string;
};

export function LessonTasksPage() {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const user = getSessionUser();
  const canManage = isTeacherOrAdmin(user);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [moduleRow, setModuleRow] = useState<ModuleRow | null>(null);
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quizTasks = useMemo(() => (tasks ?? []).filter((t) => t.type === "QUIZ"), [tasks]);
  const otherTasks = useMemo(() => (tasks ?? []).filter((t) => t.type !== "QUIZ"), [tasks]);

  useEffect(() => {
    if (!courseId || !moduleId || !lessonId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    const headers = authHeaders();

    Promise.all([
      axios.get<CourseDetail>(`${API_BASE_URL}/courses/${courseId}`, { headers }),
      axios.get<ModuleRow>(`${API_BASE_URL}/courses/${courseId}/modules/${moduleId}`, { headers }),
      axios.get<LessonRow>(`${API_BASE_URL}/modules/${moduleId}/lessons/${lessonId}`, { headers }),
      axios.get<TaskRow[]>(`${API_BASE_URL}/lessons/${lessonId}/tasks`, { headers }),
    ])
      .then(([cRes, mRes, lRes, tRes]) => {
        if (!cancelled) {
          setCourse(cRes.data);
          setModuleRow(mRes.data);
          setLesson(lRes.data);
          setTasks(tRes.data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load this lesson.");
          setCourse(null);
          setModuleRow(null);
          setLesson(null);
          setTasks([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, moduleId, lessonId]);

  if (!courseId || !moduleId || !lessonId) {
    return <Navigate to="/courses" replace />;
  }

  const taskLink = (taskId: string) =>
    `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/tasks/${taskId}`;

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 960, margin: "0 auto" }}>
      <BrowseBreadcrumb
        items={[
          { to: "/courses", label: "Courses" },
          { to: `/courses/${courseId}`, label: course?.title ?? "Course" },
          { to: `/courses/${courseId}/modules/${moduleId}`, label: moduleRow?.title ?? "Module" },
          { label: lesson?.title ?? "Lesson" },
        ]}
      />

      {loading && (
        <div className="flex justify-content-center py-6">
          <ProgressSpinner style={{ width: 48, height: 48 }} strokeWidth="4" />
        </div>
      )}

      {!loading && error && <Message severity="warn" text={error} className="w-full mb-4" />}

      {!loading && !error && lesson && (
        <>
          <div className="flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-3xl m-0">{lesson.title}</h1>
              <p className="text-color-secondary mt-2 mb-0">Quizzes and other tasks for this lesson</p>
            </div>
            {canManage && (
              <Button
                label="Add task"
                icon="pi pi-plus"
                type="button"
                onClick={() => navigate(`/lessons/${lessonId}/tasks/new`)}
              />
            )}
          </div>

          {lesson.videoUrl && (
            <Card title="Video" className="mb-4">
              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                {lesson.videoUrl}
              </a>
            </Card>
          )}

          <section className="mb-4">
            <h2 className="text-xl mt-0 mb-3">Quizzes</h2>
            {quizTasks.length === 0 ? (
              <p className="text-color-secondary m-0">No quiz tasks in this lesson.</p>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-column gap-3">
                {quizTasks.map((t) => {
                  const cfg = t.config as { question?: string } | null;
                  const preview = cfg?.question?.slice(0, 80) ?? "Quiz";
                  return (
                    <li key={t.id}>
                      <Link to={taskLink(t.id)} className="no-underline" style={{ color: "inherit" }}>
                        <Card
                          title={preview + (cfg?.question && cfg.question.length > 80 ? "…" : "")}
                          className="hover:surface-hover transition-colors transition-duration-150"
                        >
                          <Tag value="QUIZ" severity="info" className="text-xs" />
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-xl mt-0 mb-3">Other tasks</h2>
            {otherTasks.length === 0 ? (
              <p className="text-color-secondary m-0">No audio or photo tasks.</p>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-column gap-3">
                {otherTasks.map((t) => (
                  <li key={t.id}>
                    <Card title={`${t.type} task`}>
                      <Tag value={t.type} className="text-xs" />
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
