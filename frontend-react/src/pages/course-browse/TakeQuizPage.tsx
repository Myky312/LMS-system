import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { RadioButton } from "primereact/radiobutton";
import { API_BASE_URL } from "@/lib/constants/env";
import { authHeaders } from "@/lib/api/auth-headers";
import { getSessionUser } from "@/lib/auth/session";
import { USER_ROLES } from "@/lib/auth/roles";
import { BrowseBreadcrumb } from "@/components/browse/BrowseBreadcrumb";

type CourseDetail = { id: string; title: string };
type ModuleRow = { id: string; title: string };
type LessonRow = { id: string; title: string };
type TaskRow = {
  id: string;
  lessonId: string;
  type: string;
  config: QuizConfigShape;
};

type QuizConfigShape = {
  question: string;
  options: string[];
  correctAnswer?: number;
};

type SubmissionResponse = {
  id: string;
  status: string;
  taskId: string;
};

function formatAxiosError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data as { message?: unknown };
    if (typeof data.message === "string") return data.message;
    if (Array.isArray(data.message)) return data.message.map(String).join(", ");
  }
  return "Something went wrong.";
}

export function TakeQuizPage() {
  const { courseId, moduleId, lessonId, taskId } = useParams<{
    courseId: string;
    moduleId: string;
    lessonId: string;
    taskId: string;
  }>();
  const user = getSessionUser();
  const isStudent = user?.role === USER_ROLES.STUDENT;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [moduleRow, setModuleRow] = useState<ModuleRow | null>(null);
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [task, setTask] = useState<TaskRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);

  useEffect(() => {
    if (!courseId || !moduleId || !lessonId || !taskId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    const headers = authHeaders();

    Promise.all([
      axios.get<CourseDetail>(`${API_BASE_URL}/courses/${courseId}`, { headers }),
      axios.get<ModuleRow>(`${API_BASE_URL}/courses/${courseId}/modules/${moduleId}`, { headers }),
      axios.get<LessonRow>(`${API_BASE_URL}/modules/${moduleId}/lessons/${lessonId}`, { headers }),
      axios.get<TaskRow>(`${API_BASE_URL}/lessons/${lessonId}/tasks/${taskId}`, { headers }),
    ])
      .then(([cRes, mRes, lRes, tRes]) => {
        if (!cancelled) {
          setCourse(cRes.data);
          setModuleRow(mRes.data);
          setLesson(lRes.data);
          setTask(tRes.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load this task.");
          setTask(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, moduleId, lessonId, taskId]);

  if (!courseId || !moduleId || !lessonId || !taskId) {
    return <Navigate to="/courses" replace />;
  }

  const quizConfig =
    task?.type === "QUIZ" && task.config && typeof task.config === "object"
      ? (task.config as QuizConfigShape)
      : null;

  const onSubmit = async () => {
    if (!isStudent || selectedOption === null || !taskId) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { data } = await axios.post<SubmissionResponse>(
        `${API_BASE_URL}/tasks/${taskId}/submit`,
        { answer: { selectedOption } },
        { headers: authHeaders() }
      );
      setSubmission(data);
    } catch (err: unknown) {
      setSubmitError(formatAxiosError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-4 md:p-6" style={{ maxWidth: 720, margin: "0 auto" }}>
      <BrowseBreadcrumb
        items={[
          { to: "/courses", label: "Courses" },
          { to: `/courses/${courseId}`, label: course?.title ?? "Course" },
          { to: `/courses/${courseId}/modules/${moduleId}`, label: moduleRow?.title ?? "Module" },
          {
            to: `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
            label: lesson?.title ?? "Lesson",
          },
          { label: "Quiz" },
        ]}
      />

      {loading && (
        <div className="flex justify-content-center py-6">
          <ProgressSpinner style={{ width: 48, height: 48 }} strokeWidth="4" />
        </div>
      )}

      {!loading && error && <Message severity="warn" text={error} className="w-full mb-4" />}

      {!loading && !error && task && task.type !== "QUIZ" && (
        <Message
          severity="info"
          text="This task is not a quiz. Only quiz tasks can be taken here."
          className="w-full"
        />
      )}

      {!loading && !error && task && task.type === "QUIZ" && quizConfig && (
        <Card title="Quiz">
          {!isStudent && (
            <Message
              severity="info"
              text="The API only accepts quiz submissions from student accounts. Below is a preview of the question and options."
              className="w-full mb-4"
            />
          )}

          <p className="text-lg m-0 mb-4" style={{ lineHeight: 1.5 }}>
            {quizConfig.question}
          </p>

          <div className="flex flex-column gap-3 mb-4">
            {quizConfig.options.map((opt, i) => (
              <div key={i} className="flex align-items-center gap-2">
                {isStudent && !submission ? (
                  <>
                    <RadioButton
                      inputId={`quiz-opt-${i}`}
                      name="quiz"
                      value={i}
                      onChange={(e) => setSelectedOption(e.value as number)}
                      checked={selectedOption === i}
                    />
                    <label htmlFor={`quiz-opt-${i}`} className="cursor-pointer">
                      {opt}
                    </label>
                  </>
                ) : (
                  <span>{opt}</span>
                )}
              </div>
            ))}
          </div>

          {isStudent && !submission && (
            <>
              {submitError && <Message severity="error" text={submitError} className="w-full mb-3" />}
              <Button
                type="button"
                label="Submit answer"
                disabled={selectedOption === null}
                loading={submitting}
                onClick={onSubmit}
              />
            </>
          )}

          {submission && (
            <Message
              severity={submission.status === "APPROVED" ? "success" : "warn"}
              text={
                submission.status === "APPROVED"
                  ? "Correct — submission approved."
                  : submission.status === "REJECTED"
                    ? "Incorrect — submission recorded as rejected."
                    : `Submission received (status: ${submission.status}).`
              }
              className="w-full"
            />
          )}
        </Card>
      )}
    </main>
  );
}
