import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { API_BASE_URL } from "@/lib/constants/env";
import { getAccessToken, getSessionUser } from "@/lib/auth/session";
import { isTeacherOrAdmin } from "@/lib/auth/roles";

const TASK_TYPES = [
  { label: "Quiz", value: "QUIZ" as const },
  { label: "Audio", value: "AUDIO" as const },
  { label: "Photo", value: "PHOTO" as const },
];

type TaskTypeValue = (typeof TASK_TYPES)[number]["value"];

const CORRECT_OPTIONS = [
  { label: "Option 1 (index 0)", value: 0 },
  { label: "Option 2 (index 1)", value: 1 },
  { label: "Option 3 (index 2)", value: 2 },
  { label: "Option 4 (index 3)", value: 3 },
];

export function CreateTaskPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const user = getSessionUser();
  const [type, setType] = useState<TaskTypeValue>("QUIZ");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [audioInstructions, setAudioInstructions] = useState("");
  const [audioMaxDuration, setAudioMaxDuration] = useState("");
  const [photoInstructions, setPhotoInstructions] = useState("");
  const [photoElementsRaw, setPhotoElementsRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quizErrors = useMemo(() => {
    if (type !== "QUIZ") return null;
    if (!quizQuestion.trim()) return "Question is required.";
    for (let i = 0; i < 4; i++) {
      if (!quizOptions[i]?.trim()) return `Option ${i + 1} is required.`;
    }
    return null;
  }, [type, quizQuestion, quizOptions]);

  const audioErrors = useMemo(() => {
    if (type !== "AUDIO") return null;
    const raw = audioMaxDuration.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) return "Max duration must be a positive whole number (seconds).";
    return null;
  }, [type, audioMaxDuration]);

  if (!lessonId) {
    return <Navigate to="/courses" replace />;
  }

  if (!isTeacherOrAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  const buildPayload = (): { type: TaskTypeValue; config: Record<string, unknown> } | null => {
    if (type === "QUIZ") {
      if (quizErrors) return null;
      return {
        type: "QUIZ",
        config: {
          question: quizQuestion.trim(),
          options: quizOptions.map((o) => o.trim()),
          correctAnswer,
        },
      };
    }
    if (type === "AUDIO") {
      if (audioErrors) return null;
      const config: Record<string, unknown> = {};
      if (audioInstructions.trim()) config.instructions = audioInstructions.trim();
      const raw = audioMaxDuration.trim();
      if (raw) config.maxDuration = Number(raw);
      return { type: "AUDIO", config };
    }
    const config: Record<string, unknown> = {};
    if (photoInstructions.trim()) config.instructions = photoInstructions.trim();
    const lines = photoElementsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length) config.requiredElements = lines;
    return { type: "PHOTO", config };
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const body = buildPayload();
    if (!body) return;

    const token = getAccessToken();
    if (!token) return;

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/lessons/${lessonId}/tasks`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/courses", { replace: true });
    } catch {
      setError("Could not create the task. Check the fields match the selected type (quiz needs 4 options).");
    } finally {
      setSubmitting(false);
    }
  };

  const formInvalid = type === "QUIZ" ? !!quizErrors : type === "AUDIO" ? !!audioErrors : false;

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="mb-4">
        <Link to="/courses" className="text-sm text-primary no-underline">
          ← Back to courses
        </Link>
        <h1 className="text-3xl m-0 mt-2">New task</h1>
        <p className="text-color-secondary mt-2 mb-0">
          Quiz tasks require exactly four options and a correct answer index 0–3.
        </p>
      </div>

      <Card>
        <form className="flex flex-column gap-4" onSubmit={onSubmit}>
          {error && <Message severity="error" text={error} className="w-full" />}

          <div className="flex flex-column gap-2">
            <label htmlFor="task-type" className="font-medium">
              Task type
            </label>
            <Dropdown
              inputId="task-type"
              value={type}
              options={TASK_TYPES}
              onChange={(e) => setType(e.value)}
              className="w-full"
            />
          </div>

          {type === "QUIZ" && (
            <>
              <div className="flex flex-column gap-2">
                <label htmlFor="quiz-q" className="font-medium">
                  Question
                </label>
                <InputTextarea
                  id="quiz-q"
                  value={quizQuestion}
                  onChange={(ev) => setQuizQuestion(ev.target.value)}
                  rows={3}
                  className="w-full"
                  autoResize
                />
              </div>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex flex-column gap-2">
                  <label htmlFor={`opt-${i}`} className="font-medium">
                    Option {i + 1}
                  </label>
                  <InputText
                    id={`opt-${i}`}
                    value={quizOptions[i]}
                    onChange={(ev) => {
                      const next = [...quizOptions];
                      next[i] = ev.target.value;
                      setQuizOptions(next);
                    }}
                    className="w-full"
                  />
                </div>
              ))}
              <div className="flex flex-column gap-2">
                <label htmlFor="correct" className="font-medium">
                  Correct answer
                </label>
                <Dropdown
                  inputId="correct"
                  value={correctAnswer}
                  options={CORRECT_OPTIONS}
                  onChange={(e) => setCorrectAnswer(e.value)}
                  className="w-full"
                />
              </div>
            </>
          )}

          {type === "AUDIO" && (
            <>
              <div className="flex flex-column gap-2">
                <label htmlFor="audio-inst" className="font-medium">
                  Instructions <span className="text-color-secondary font-normal">(optional)</span>
                </label>
                <InputTextarea
                  id="audio-inst"
                  value={audioInstructions}
                  onChange={(ev) => setAudioInstructions(ev.target.value)}
                  rows={3}
                  className="w-full"
                  autoResize
                />
              </div>
              <div className="flex flex-column gap-2">
                <label htmlFor="audio-max" className="font-medium">
                  Max duration (seconds) <span className="text-color-secondary font-normal">(optional)</span>
                </label>
                <InputText
                  id="audio-max"
                  value={audioMaxDuration}
                  onChange={(ev) => setAudioMaxDuration(ev.target.value)}
                  className="w-full"
                  placeholder="e.g. 120"
                />
                {audioErrors && <small className="p-error">{audioErrors}</small>}
              </div>
            </>
          )}

          {type === "PHOTO" && (
            <>
              <div className="flex flex-column gap-2">
                <label htmlFor="photo-inst" className="font-medium">
                  Instructions <span className="text-color-secondary font-normal">(optional)</span>
                </label>
                <InputTextarea
                  id="photo-inst"
                  value={photoInstructions}
                  onChange={(ev) => setPhotoInstructions(ev.target.value)}
                  rows={3}
                  className="w-full"
                  autoResize
                />
              </div>
              <div className="flex flex-column gap-2">
                <label htmlFor="photo-el" className="font-medium">
                  Required elements <span className="text-color-secondary font-normal">(optional, one per line)</span>
                </label>
                <InputTextarea
                  id="photo-el"
                  value={photoElementsRaw}
                  onChange={(ev) => setPhotoElementsRaw(ev.target.value)}
                  rows={4}
                  className="w-full"
                  autoResize
                />
              </div>
            </>
          )}

          {quizErrors && type === "QUIZ" && <small className="p-error">{quizErrors}</small>}

          <div className="flex gap-2 flex-wrap">
            <Button type="submit" label="Create task" loading={submitting} disabled={formInvalid} />
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
