"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { photoConfigSchema } from "../schemas/create-task-schemas";
import { z } from "zod";

const schema = z.object({ type: z.literal("PHOTO"), config: photoConfigSchema });
type FormValues = z.infer<typeof schema>;

type PhotoTaskFormProps = {
  onSubmit: (payload: FormValues) => Promise<unknown>;
  isPending?: boolean;
};

export function PhotoTaskForm({ onSubmit, isPending = false }: PhotoTaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "PHOTO",
      config: { instructions: "", requiredElements: [] },
    },
  });

  const elements = form.watch("config.requiredElements") ?? [];
  const addElement = () => {
    form.setValue("config.requiredElements", [...elements, ""]);
  };
  const removeElement = (index: number) => {
    form.setValue(
      "config.requiredElements",
      elements.filter((_, i) => i !== index)
    );
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="max-w-xl space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions (optional)</Label>
        <Input
          id="instructions"
          {...form.register("config.instructions")}
          placeholder="e.g. Include tajweed markers"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Required elements (optional)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addElement}>
            Add
          </Button>
        </div>
        {elements.map((_, i) => (
          <div key={i} className="flex gap-2">
            <Input
              {...form.register(`config.requiredElements.${i}`)}
              placeholder={`Element ${i + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeElement(i)}
            >
              Remove
            </Button>
          </div>
        ))}
        {form.formState.errors.config?.requiredElements && (
          <p className="text-sm text-destructive">
            {form.formState.errors.config.requiredElements.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create task"}
      </Button>
    </form>
  );
}
