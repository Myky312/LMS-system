"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const { courseId, moduleId } = use(params);
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/courses/${courseId}/modules/${moduleId}`}>← Back to module</Link>
      </Button>
      <EmptyState
        title="Lesson details"
        description="Sprint 2: lesson details and tasks list will be implemented here."
      />
    </div>
  );
}
