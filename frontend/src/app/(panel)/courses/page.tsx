"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils/format-date";
import { useCoursesQuery } from "@/features/courses/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageLoader";
import { PageError } from "@/components/common/PageError";
import { EmptyState } from "@/components/common/EmptyState";
import { Plus } from "lucide-react";

export default function CoursesPage() {
  const { data: courses, isLoading, isError, refetch } = useCoursesQuery();

  if (isLoading) return <PageLoader />;
  if (isError) return <PageError onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <Button asChild>
          <Link href="/courses/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Create course
          </Link>
        </Button>
      </div>
      {!courses?.length ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to get started."
          action={
            <Button asChild>
              <Link href="/courses/new">Create course</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/courses/${course.id}`}
                className="block rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
              >
                <h3 className="font-medium">{course.title}</h3>
                {course.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {course.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDate(course.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
