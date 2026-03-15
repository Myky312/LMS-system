"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";

export default function NewLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = use(params);
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/courses/${courseId}/modules/${moduleId}`}>← Back to module</Link>
      </Button>
      <EmptyState
        title="Create lesson"
        description="Sprint 2: lesson creation form will be implemented here."
      />
    </div>
  );
}
