"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateModuleMutation } from "@/features/modules/hooks/use-modules";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  orderIndex: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewModulePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const create = useCreateModuleMutation(courseId);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", orderIndex: 0 },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const mod = await create.mutateAsync({
      title: values.title,
      orderIndex: values.orderIndex,
    });
    router.push(`/courses/${courseId}/modules/${mod.id}`);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/courses/${courseId}`}>← Back to course</Link>
        </Button>
        <h1 className="text-2xl font-semibold">Create module</h1>
      </div>
      <form onSubmit={onSubmit} className="max-w-xl space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="orderIndex">Order index</Label>
          <Input id="orderIndex" type="number" min={0} {...form.register("orderIndex")} />
        </div>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create"}
        </Button>
      </form>
    </div>
  );
}
