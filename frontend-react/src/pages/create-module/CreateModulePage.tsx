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

type CreatedModule = { id: string; title: string };

export function CreateModulePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const user = getSessionUser();
  const [title, setTitle] = useState("");
  const [orderIndex, setOrderIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleError = useMemo(() => {
    if (!title.trim()) return "Title is required.";
    return null;
  }, [title]);

  if (!courseId) {
    return <Navigate to="/courses" replace />;
  }

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
      const { data } = await axios.post<CreatedModule>(
        `${API_BASE_URL}/courses/${courseId}/modules`,
        {
          title: title.trim(),
          ...(orderIndex != null && orderIndex >= 0 ? { orderIndex } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/modules/${data.id}/lessons/new`, { replace: true });
    } catch {
      setError("Could not create the module. Check that you own this course or try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="mb-4">
        <Link to="/courses" className="text-sm text-primary no-underline">
          ← Back to courses
        </Link>
        <h1 className="text-3xl m-0 mt-2">New module</h1>
        <p className="text-color-secondary mt-2 mb-0">
          Add a module to this course. Next you can add lessons and tasks.
        </p>
      </div>

      <Card>
        <form className="flex flex-column gap-4" onSubmit={onSubmit}>
          {error && <Message severity="error" text={error} className="w-full" />}

          <div className="flex flex-column gap-2">
            <label htmlFor="module-title" className="font-medium">
              Title
            </label>
            <InputText
              id="module-title"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              className="w-full"
              placeholder="e.g. Module 1: Letters"
            />
            {titleError && <small className="p-error">{titleError}</small>}
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="module-order" className="font-medium">
              Order index <span className="text-color-secondary font-normal">(optional)</span>
            </label>
            <InputNumber
              inputId="module-order"
              value={orderIndex ?? undefined}
              onValueChange={(e) => setOrderIndex(e.value ?? null)}
              min={0}
              showButtons
              className="w-full"
              placeholder="Auto if empty"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button type="submit" label="Create module" loading={submitting} disabled={!!titleError} />
            <Button
              type="button"
              label="Cancel"
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
