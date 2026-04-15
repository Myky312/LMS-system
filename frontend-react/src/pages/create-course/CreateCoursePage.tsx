import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { API_BASE_URL } from "@/lib/constants/env";
import { getAccessToken, getSessionUser } from "@/lib/auth/session";
import { isTeacherOrAdmin } from "@/lib/auth/roles";

type CreatedCourse = { id: string; title: string };

export function CreateCoursePage() {
  const navigate = useNavigate();
  const user = getSessionUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleError = useMemo(() => {
    if (!title.trim()) return "Укажите название.";
    return null;
  }, [title]);

  if (!isTeacherOrAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (titleError) return;

    const token = getAccessToken();
    if (!token) return;

    setSubmitting(true);
    try {
      const { data } = await axios.post<CreatedCourse>(
        `${API_BASE_URL}/courses`,
        { title: title.trim(), description: description.trim() || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/courses/${data.id}/modules/new`, { replace: true });
    } catch {
      setError("Не удалось создать курс. Проверьте название и права доступа.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="mb-4">
        <Link to="/courses" className="text-sm text-primary no-underline">
          ← К списку курсов
        </Link>
        <h1 className="text-3xl m-0 mt-2">Новый курс</h1>
        <p className="text-color-secondary mt-2 mb-0">
          Создайте курс, затем добавляйте модули и уроки.
        </p>
      </div>

      <Card>
        <form className="flex flex-column gap-4" onSubmit={onSubmit}>
          {error && <Message severity="error" text={error} className="w-full" />}

          <div className="flex flex-column gap-2">
            <label htmlFor="course-title" className="font-medium">
              Название
            </label>
            <InputText
              id="course-title"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              className="w-full"
              placeholder="Например: Основы таджвида"
            />
            {titleError && <small className="p-error">{titleError}</small>}
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="course-desc" className="font-medium">
              Описание <span className="text-color-secondary font-normal">(необязательно)</span>
            </label>
            <InputTextarea
              id="course-desc"
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={4}
              className="w-full"
              autoResize
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button type="submit" label="Создать курс" loading={submitting} disabled={!!titleError} />
            <Button
              type="button"
              label="Отмена"
              severity="secondary"
              outlined
              onClick={() => navigate("/courses")}
            />
          </div>
        </form>
      </Card>
    </main>
  );
}
