"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateTaskMutation } from "@/features/tasks/hooks/use-tasks";
import { QuizTaskForm } from "@/features/tasks/components/QuizTaskForm";
import { AudioTaskForm } from "@/features/tasks/components/AudioTaskForm";
import { PhotoTaskForm } from "@/features/tasks/components/PhotoTaskForm";
import { Button } from "@/components/ui/button";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { normalizeError } from "@/lib/api/axios-client";
import type { TaskType } from "@/types/domain";
import type { CreateTaskForm } from "@/features/tasks/schemas/create-task-schemas";

export default function NewTaskPage({
  params,
}: {
  params: Promise<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>;
}) {
  const { courseId, moduleId, lessonId } = use(params);
  const router = useRouter();
  const create = useCreateTaskMutation(lessonId);
  const [taskType, setTaskType] = useState<TaskType | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (payload: CreateTaskForm) => {
    setSubmitError(null);
    try {
      const task = await create.mutateAsync(payload);
      router.push(
        `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/tasks/${task.id}`
      );
    } catch (err) {
      const normalized = normalizeError(err);
      if (normalized.statusCode === 403) return;
      setSubmitError(
        Array.isArray(normalized.message)
          ? normalized.message.join(", ")
          : normalized.message
      );
    }
  };

  if (create.isError && normalizeError(create.error).statusCode === 403) {
    return <ForbiddenState />;
  }

  const basePath = `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}>← Back to lesson</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Create task</h1>
      </div>

      {!taskType ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose task type:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTaskType("QUIZ")}
            >
              QUIZ
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTaskType("AUDIO")}
            >
              AUDIO
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTaskType("PHOTO")}
            >
              PHOTO
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTaskType(null);
                setSubmitError(null);
              }}
            >
              ← Change type
            </Button>
            <span className="text-sm text-muted-foreground">Type: {taskType}</span>
          </div>
          {submitError && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}
          {taskType === "QUIZ" && (
            <QuizTaskForm
              onSubmit={handleSubmit}
              isPending={create.isPending}
            />
          )}
          {taskType === "AUDIO" && (
            <AudioTaskForm
              onSubmit={handleSubmit}
              isPending={create.isPending}
            />
          )}
          {taskType === "PHOTO" && (
            <PhotoTaskForm
              onSubmit={handleSubmit}
              isPending={create.isPending}
            />
          )}
        </>
      )}
    </div>
  );
}
