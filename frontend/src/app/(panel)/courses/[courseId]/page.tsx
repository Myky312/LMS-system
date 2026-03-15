"use client";

import { use } from "react";
import { formatDate } from "@/lib/utils/format-date";
import Link from "next/link";
import { useCourseQuery } from "@/features/courses/hooks/use-courses";
import { useModulesQuery } from "@/features/modules/hooks/use-modules";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageLoader";
import { PageError } from "@/components/common/PageError";
import { NotFoundState } from "@/components/common/NotFoundState";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { EmptyState } from "@/components/common/EmptyState";
import { Plus } from "lucide-react";
import { normalizeError } from "@/lib/api/axios-client";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const courseQuery = useCourseQuery(courseId);
  const modulesQuery = useModulesQuery(courseId);

  if (courseQuery.isLoading) return <PageLoader />;
  if (courseQuery.isError) {
    const err = normalizeError(courseQuery.error);
    if (err.statusCode === 404) return <NotFoundState />;
    if (err.statusCode === 403) return <ForbiddenState />;
    return <PageError message={err.message} onRetry={() => courseQuery.refetch()} />;
  }
  const course = courseQuery.data;
  if (!course) return <NotFoundState />;

  const modules = modulesQuery.data ?? [];
  const modulesLoading = modulesQuery.isLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          {course.description && (
            <p className="mt-2 text-muted-foreground">{course.description}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Created {formatDate(course.createdAt)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/courses/${courseId}/edit`}>Edit</Link>
        </Button>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Modules</h2>
          <Button asChild size="sm">
            <Link href={`/courses/${courseId}/modules/new`} className="gap-2">
              <Plus className="h-4 w-4" />
              Create module
            </Link>
          </Button>
        </div>
        {modulesLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : !modules.length ? (
          <EmptyState
            title="No modules"
            description="Add a module to organize lessons."
            action={
              <Button asChild size="sm">
                <Link href={`/courses/${courseId}/modules/new`}>Create module</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {modules
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((mod) => (
                <li key={mod.id}>
                  <Link
                    href={`/courses/${courseId}/modules/${mod.id}`}
                    className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
                  >
                    <span className="font-medium">{mod.title}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      Order: {mod.orderIndex}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
