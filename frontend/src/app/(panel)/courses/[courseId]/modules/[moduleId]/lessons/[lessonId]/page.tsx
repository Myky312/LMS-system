"use client";

import { use } from "react";
import Link from "next/link";
import { useLessonQuery } from "@/features/lessons/hooks/use-lessons";
import { useTasksQuery } from "@/features/tasks/hooks/use-tasks";
import { getTaskSummary } from "@/features/tasks/utils/task-summary";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageLoader";
import { NotFoundState } from "@/components/common/NotFoundState";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { EmptyState } from "@/components/common/EmptyState";
import { PageError } from "@/components/common/PageError";
import { normalizeError } from "@/lib/api/axios-client";
import { Video, Plus } from "lucide-react";

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const { courseId, moduleId, lessonId } = use(params);
  const { data: lesson, isLoading, isError, error } = useLessonQuery(moduleId, lessonId);
  const { data: tasks, isLoading: tasksLoading } = useTasksQuery(lessonId);

  if (isLoading) return <PageLoader />;
  if (isError) {
    const err = normalizeError(error);
    if (err.statusCode === 404) return <NotFoundState />;
    if (err.statusCode === 403) return <ForbiddenState />;
    return <PageError message={err.message} onRetry={() => {}} />;
  }
  if (!lesson) return <NotFoundState />;

  const tasksSection = tasksLoading ? (
    <div className="h-24 animate-pulse rounded-lg bg-muted" />
  ) : !tasks || tasks.length === 0 ? (
    <EmptyState
      title="No tasks yet"
      description="Add a task to this lesson."
      action={
        <Button size="sm" asChild>
          <Link
            href={`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/tasks/new`}
          >
            Create task
          </Link>
        </Button>
      }
    />
  ) : (
    <ul className="space-y-2">
      {[...tasks]
        .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || a.id.localeCompare(b.id))
        .map((task) => {
          const { title, subtitle } = getTaskSummary(task);
          return (
            <li key={task.id}>
              <Link
                href={`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/tasks/${task.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {task.type}
                </span>
                <p className="font-medium">{title}</p>
                {subtitle != null && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </Link>
            </li>
          );
        })}
    </ul>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${courseId}/modules/${moduleId}`}>← Back to module</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{lesson.title}</h1>
      </div>

      <section>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Position</dt>
            <dd className="font-medium">#{lesson.orderIndex + 1}</dd>
          </div>
          {lesson.videoUrl != null && lesson.videoUrl !== "" && (
            <div>
              <dt className="text-sm text-muted-foreground">Video</dt>
              <dd className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Open link
                </a>
              </dd>
            </div>
          )}
        </dl>
        {lesson.videoUrl != null && lesson.videoUrl !== "" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Video player placeholder (Sprint 3 / media).
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Tasks</h2>
          <Button size="sm" asChild>
            <Link
              href={`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/tasks/new`}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create task
            </Link>
          </Button>
        </div>
        {tasksSection}
      </section>
    </div>
  );
}