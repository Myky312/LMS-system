"use client";

import { useRouter } from "next/navigation";
import { CourseForm } from "@/features/courses/components/CourseForm";
import { useCreateCourseMutation } from "@/features/courses/hooks/use-courses";

export default function NewCoursePage() {
  const router = useRouter();
  const create = useCreateCourseMutation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create course</h1>
      <CourseForm
        onSubmit={async (payload) => {
          const course = await create.mutateAsync(payload);
          router.push(`/courses/${course.id}`);
        }}
        submitLabel="Create"
        isPending={create.isPending}
      />
    </div>
  );
}
