"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateLessonMutation } from "@/features/lessons/hooks/use-lessons";
import { LessonForm } from "@/features/lessons/components/LessonForm";
import { Button } from "@/components/ui/button";
import { ForbiddenState } from "@/components/common/ForbiddenState";
import { normalizeError } from "@/lib/api/axios-client";
import { useState } from "react";

export default function NewLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = use(params);
  const router = useRouter();
  const create = useCreateLessonMutation(moduleId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (payload: { title: string; videoUrl?: string }) => {
    setSubmitError(null);
    try {
      const lesson = await create.mutateAsync(payload);
      router.push(
        `/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`
      );
    } catch (err) {
      const normalized = normalizeError(err);
      if (normalized.statusCode === 403) return; // ForbiddenState handled below if we want to show on page
      setSubmitError(
        Array.isArray(normalized.message) ? normalized.message.join(", ") : normalized.message
      );
    }
  };

  if (create.isError && normalizeError(create.error).statusCode === 403) {
    return <ForbiddenState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${courseId}/modules/${moduleId}`}>← Back to module</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Create lesson</h1>
      </div>
      {submitError && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}
      <LessonForm
        onSubmit={handleSubmit}
        submitLabel="Create"
        isPending={create.isPending}
      />
    </div>
  );
}
