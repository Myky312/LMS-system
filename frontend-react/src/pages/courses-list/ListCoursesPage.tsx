import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { API_BASE_URL } from "@/lib/constants/env";
import { getAccessToken, getSessionUser } from "@/lib/auth/session";
import { isTeacherOrAdmin } from "@/lib/auth/roles";

type CourseRow = {
  id: string;
  title: string;
  description?: string | null;
  createdAt?: string;
};

export function ListCoursesPage() {
  const navigate = useNavigate();
  const sessionUser = getSessionUser();
  const canManage = isTeacherOrAdmin(sessionUser);
  const [courses, setCourses] = useState<CourseRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken()!;

    let cancelled = false;
    setLoading(true);
    setError(null);
    axios
      .get<CourseRow[]>(`${API_BASE_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!cancelled) setCourses(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load courses. Check that the API is running and you have access.");
          setCourses([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 960, margin: "0 auto" }}>
      <div className="flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-3xl m-0">Courses</h1>
          <p className="text-color-secondary mt-2 mb-0">All courses you can access.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canManage && (
            <Button
              label="New course"
              icon="pi pi-plus"
              type="button"
              onClick={() => navigate("/courses/new")}
            />
          )}
          <Button label="Refresh" icon="pi pi-refresh" type="button" onClick={() => window.location.reload()} />
        </div>
      </div>

      {loading && (
        <div className="flex justify-content-center py-6">
          <ProgressSpinner style={{ width: 48, height: 48 }} strokeWidth="4" />
        </div>
      )}

      {!loading && error && <Message severity="warn" text={error} className="w-full mb-4" />}

      {!loading && !error && courses && courses.length === 0 && (
        <Card title="No courses yet">
          <p className="text-color-secondary m-0">Create a course from the API or seed data to see it here.</p>
        </Card>
      )}

      {!loading && courses && courses.length > 0 && (
        <ul className="list-none p-0 m-0 flex flex-column gap-3">
          {courses.map((c) => (
            <li key={c.id}>
              <Card
                title={
                  <Link to={`/courses/${c.id}`} className="text-color no-underline hover:text-primary">
                    {c.title}
                  </Link>
                }
                footer={
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      label="Open course"
                      icon="pi pi-arrow-right"
                      type="button"
                      outlined
                      size="small"
                      onClick={() => navigate(`/courses/${c.id}`)}
                    />
                    {canManage && (
                      <Button
                        label="Add module"
                        icon="pi pi-folder-plus"
                        type="button"
                        outlined
                        size="small"
                        onClick={() => navigate(`/courses/${c.id}/modules/new`)}
                      />
                    )}
                  </div>
                }
              >
                {c.description && (
                  <p className="text-color-secondary m-0 mt-2">{c.description}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
