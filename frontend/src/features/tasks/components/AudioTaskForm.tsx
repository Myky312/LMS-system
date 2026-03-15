"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { audioConfigSchema } from "../schemas/create-task-schemas";
import { z } from "zod";

const schema = z.object({ type: z.literal("AUDIO"), config: audioConfigSchema });
type FormValues = z.infer<typeof schema>;

type AudioTaskFormProps = {
  onSubmit: (payload: FormValues) => Promise<unknown>;
  isPending?: boolean;
};

export function AudioTaskForm({ onSubmit, isPending = false }: AudioTaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "AUDIO",
      config: { instructions: "", maxDuration: undefined },
    },
  });

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
          placeholder="e.g. Record yourself reading the verse"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxDuration">Max duration in seconds (optional)</Label>
        <Input
          id="maxDuration"
          type="number"
          min={1}
          {...form.register("config.maxDuration", { valueAsNumber: true })}
          placeholder="e.g. 60"
        />
        {form.formState.errors.config?.maxDuration && (
          <p className="text-sm text-destructive">
            {form.formState.errors.config.maxDuration.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create task"}
      </Button>
    </form>
  );
}
