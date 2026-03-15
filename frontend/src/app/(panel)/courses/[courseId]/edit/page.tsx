"use client";

import { use } from "react";
import Link from "next/link";
import { useCourseQuery } from "@/features/courses/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageLoader";
import { NotFoundState } from "@/components/common/NotFoundState";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { normalizeError } from "@/lib/api/axios-client";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const courseQuery = useCourseQuery(courseId);

  if (courseQuery.isLoading) return <PageLoader />;
  if (courseQuery.isError) {
    const err = normalizeError(courseQuery.error);
    if (err.statusCode === 404) return <NotFoundState />;
    if (err.statusCode === 403) return <ForbiddenState />;
    return null;
  }
  const course = courseQuery.data;
  if (!course) return <NotFoundState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${courseId}`}>← Back</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Edit course</h1>
      </div>
      <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        Update course is not available yet — backend does not expose PATCH /courses/:id. Current title: &quot;{course.title}&quot;
      </p>
    </div>
  );
}
