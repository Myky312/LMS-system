"use client";

import { use } from "react";
import Link from "next/link";
import { useTaskQuery } from "@/features/tasks/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageLoader";
import { NotFoundState } from "@/components/common/NotFoundState";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { normalizeError } from "@/lib/api/axios-client";
import type { Task } from "@/types/domain";

function TaskDetailsContent({
  task,
  basePath,
}: {
  task: Task;
  basePath: string;
}) {
  switch (task.type) {
    case "QUIZ": {
      const config = task.config;
      const correctIndex = config.correctAnswer;
      return (
        <div className="space-y-4">
          <div>
            <dt className="text-sm text-muted-foreground">Question</dt>
            <dd className="mt-1 font-medium">{config.question}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Options</dt>
            <dd className="mt-2 space-y-2">
              {config.options.map((opt, i) => (
                <div
                  key={i}
                  className={`rounded border p-2 ${
                    i === correctIndex
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border"
                  }`}
                >
                  {i + 1}. {opt}
                  {i === correctIndex && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (correct)
                    </span>
                  )}
                </div>
              ))}
            </dd>
          </div>
        </div>
      );
    }
    case "AUDIO": {
      const config = task.config;
      return (
        <div className="space-y-2">
          {config.instructions != null && config.instructions !== "" && (
            <div>
              <dt className="text-sm text-muted-foreground">Instructions</dt>
              <dd className="mt-1">{config.instructions}</dd>
            </div>
          )}
          {config.maxDuration != null && (
            <div>
              <dt className="text-sm text-muted-foreground">Max duration</dt>
              <dd className="mt-1">{config.maxDuration} seconds</dd>
            </div>
          )}
          {(!config.instructions || config.instructions === "") &&
            config.maxDuration == null && (
              <p className="text-sm text-muted-foreground">No instructions or duration set.</p>
            )}
        </div>
      );
    }
    case "PHOTO": {
      const config = task.config;
      return (
        <div className="space-y-2">
          {config.instructions != null && config.instructions !== "" && (
            <div>
              <dt className="text-sm text-muted-foreground">Instructions</dt>
              <dd className="mt-1">{config.instructions}</dd>
            </div>
          )}
          {config.requiredElements != null && config.requiredElements.length > 0 && (
            <div>
              <dt className="text-sm text-muted-foreground">Required elements</dt>
              <dd className="mt-1">
                <ul className="list-inside list-disc">
                  {config.requiredElements.map((el, i) => (
                    <li key={i}>{el}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {(!config.instructions || config.instructions === "") &&
            (!config.requiredElements || config.requiredElements.length === 0) && (
              <p className="text-sm text-muted-foreground">No instructions or required elements.</p>
            )}
        </div>
      );
    }
    default: {
      const _: never = task;
      return <p className="text-sm text-muted-foreground">Unknown task type.</p>;
    }
  }
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{
    courseId: string;
    moduleId: string;
    lessonId: string;
    taskId: string;
  }>;
}) {
  const { courseId, moduleId, lessonId, taskId } = use(params);
  const { data: task, isLoading, isError, error } = useTaskQuery(lessonId, taskId);
  const basePath = `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`;

  if (isLoading) return <PageLoader />;
  if (isError) {
    const err = normalizeError(error);
    if (err.statusCode === 404) return <NotFoundState />;
    if (err.statusCode === 403) return <ForbiddenState />;
    return null;
  }
  if (!task) return <NotFoundState />;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}>← Back to lesson</Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          Task: {task.type}
        </h1>
      </div>

      <section>
        <TaskDetailsContent task={task} basePath={basePath} />
      </section>
    </div>
  );
}
