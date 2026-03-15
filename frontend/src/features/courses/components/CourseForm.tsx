"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateCoursePayload } from "../api/courses-api";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type CourseFormProps = {
  defaultValues?: Partial<FormValues>;
  onSubmit: (payload: CreateCoursePayload) => Promise<unknown>;
  submitLabel?: string;
  isPending?: boolean;
};

export function CourseForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  isPending = false,
}: CourseFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { title: "", description: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      title: values.title,
      description: values.description ?? undefined,
    });
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" {...form.register("description")} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
