import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { API_BASE_URL } from "@/lib/constants/env";
import { getAccessToken, getSessionUser } from "@/lib/auth/session";
import { isTeacherOrAdmin } from "@/lib/auth/roles";

type CreatedLesson = { id: string; title: string };

export function CreateLessonPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const user = getSessionUser();
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [orderIndex, setOrderIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleError = useMemo(() => {
    if (!title.trim()) return "Укажите название.";
    return null;
  }, [title]);

  const videoUrlError = useMemo(() => {
    const v = videoUrl.trim();
    if (!v) return null;
    try {
      const u = new URL(v);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return "Адрес должен начинаться с http:// или https://";
      }
      return null;
    } catch {
      return "Введите корректный URL или оставьте поле пустым.";
    }
  }, [videoUrl]);

  if (!moduleId) {
    return <Navigate to="/courses" replace />;
  }

  if (!isTeacherOrAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (titleError || videoUrlError) return;

    const token = getAccessToken();
    if (!token) return;

    setSubmitting(true);
    try {
      const { data } = await axios.post<CreatedLesson>(
        `${API_BASE_URL}/modules/${moduleId}/lessons`,
        {
          title: title.trim(),
          ...(videoUrl.trim() ? { videoUrl: videoUrl.trim() } : {}),
          ...(orderIndex != null && orderIndex >= 0 ? { orderIndex } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/lessons/${data.id}/tasks/new`, { replace: true });
    } catch {
      setError("Не удалось создать урок. Проверьте ссылку на видео и права доступа.");
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
        <h1 className="text-3xl m-0 mt-2">Новый урок</h1>
        <p className="text-color-secondary mt-2 mb-0">
          Добавьте урок в этот модуль, затем прикрепите задания.
        </p>
      </div>

      <Card>
        <form className="flex flex-column gap-4" onSubmit={onSubmit}>
          {error && <Message severity="error" text={error} className="w-full" />}

          <div className="flex flex-column gap-2">
            <label htmlFor="lesson-title" className="font-medium">
              Название
            </label>
            <InputText
              id="lesson-title"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              className="w-full"
              placeholder="Например: Урок 1: Аль-Фатиха"
            />
            {titleError && <small className="p-error">{titleError}</small>}
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="lesson-video" className="font-medium">
              Ссылка на видео <span className="text-color-secondary font-normal">(необязательно)</span>
            </label>
            <InputText
              id="lesson-video"
              value={videoUrl}
              onChange={(ev) => setVideoUrl(ev.target.value)}
              className="w-full"
              placeholder="https://…"
            />
            {videoUrlError && <small className="p-error">{videoUrlError}</small>}
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="lesson-order" className="font-medium">
              Порядковый номер{" "}
              <span className="text-color-secondary font-normal">(необязательно)</span>
            </label>
            <InputNumber
              inputId="lesson-order"
              value={orderIndex ?? undefined}
              onValueChange={(e) => setOrderIndex(e.value ?? null)}
              min={0}
              showButtons
              className="w-full"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              type="submit"
              label="Создать урок"
              loading={submitting}
              disabled={!!titleError || !!videoUrlError}
            />
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
