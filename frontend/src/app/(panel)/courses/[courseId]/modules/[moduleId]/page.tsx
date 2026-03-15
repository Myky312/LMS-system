"use client";

import { use, useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/axios-client";
import { useQuery } from "@tanstack/react-query";
import { useLessonsQuery } from "@/features/lessons/hooks/use-lessons";
import { ReorderLessonsDialog } from "@/features/lessons/components/ReorderLessonsDialog";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Plus, Video, ArrowUpDown } from "lucide-react";

export default function ModuleDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = use(params);
  const { data: module, isLoading: moduleLoading } = useQuery({
    queryKey: ["module", moduleId],
    queryFn: async () => {
      const { data } = await authApi.get(`/courses/${courseId}/modules/${moduleId}`);
      return data as { id: string; title: string; orderIndex: number };
    },
    enabled: !!courseId && !!moduleId,
  });
  const { data: lessons, isLoading: lessonsLoading } = useLessonsQuery(moduleId);
  const [reorderOpen, setReorderOpen] = useState(false);

  if (moduleLoading || !module) return <PageLoader />;

  const sortedLessons = (lessons ?? [])
    .slice()
    .sort(
      (a, b) =>
        a.orderIndex - b.orderIndex || a.id.localeCompare(b.id)
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${courseId}`}>← Course</Link>
        </Button>
        <h1 className="text-2xl font-semibold">{module.title}</h1>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Lessons</h2>
          <div className="flex gap-2">
            {sortedLessons.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setReorderOpen(true)}
              >
                <ArrowUpDown className="h-4 w-4" />
                Reorder lessons
              </Button>
            )}
            <Button asChild size="sm">
              <Link href={`/courses/${courseId}/modules/${moduleId}/lessons/new`} className="gap-2">
                <Plus className="h-4 w-4" />
                Create lesson
              </Link>
            </Button>
          </div>
        </div>
        {lessonsLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : !sortedLessons.length ? (
          <EmptyState
            title="No lessons"
            description="Add a lesson to this module."
            action={
              <Button asChild size="sm">
                <Link href={`/courses/${courseId}/modules/${moduleId}/lessons/new`}>
                  Create lesson
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {sortedLessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <span className="font-medium">{lesson.title}</span>
                  <span className="text-sm text-muted-foreground">
                    #{lesson.orderIndex + 1}
                  </span>
                  {lesson.videoUrl && (
                    <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Video className="h-3 w-3" />
                      Video
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ReorderLessonsDialog
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        moduleId={moduleId}
        lessons={sortedLessons}
      />
    </div>
  );
}
