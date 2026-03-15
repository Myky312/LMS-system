"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateLessonPayload } from "../api/lessons-api";

const lessonFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof lessonFormSchema>;

type LessonFormProps = {
  defaultValues?: Partial<FormValues>;
  onSubmit: (payload: CreateLessonPayload) => Promise<unknown>;
  submitLabel?: string;
  isPending?: boolean;
};

export function LessonForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  isPending = false,
}: LessonFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: defaultValues ?? { title: "", videoUrl: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      title: values.title,
      videoUrl: values.videoUrl?.trim() ? values.videoUrl : undefined,
    });
  });

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL (optional)</Label>
        <Input id="videoUrl" type="url" placeholder="https://..." {...form.register("videoUrl")} />
        {form.formState.errors.videoUrl && (
          <p className="text-sm text-destructive">{form.formState.errors.videoUrl.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
