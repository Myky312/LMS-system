"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { quizConfigSchema } from "../schemas/create-task-schemas";
import { z } from "zod";

const schema = z.object({ type: z.literal("QUIZ"), config: quizConfigSchema });
type FormValues = z.infer<typeof schema>;

type QuizTaskFormProps = {
  onSubmit: (payload: FormValues) => Promise<unknown>;
  isPending?: boolean;
};

export function QuizTaskForm({ onSubmit, isPending = false }: QuizTaskFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "QUIZ",
      config: {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="max-w-xl space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Input
          id="question"
          {...form.register("config.question")}
          placeholder="e.g. What is the first surah?"
        />
        {form.formState.errors.config?.question && (
          <p className="text-sm text-destructive">
            {form.formState.errors.config.question.message}
          </p>
        )}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Label htmlFor={`option-${i}`}>Option {i + 1}</Label>
          <Input
            id={`option-${i}`}
            {...form.register(`config.options.${i}`)}
            placeholder={`Option ${i + 1}`}
          />
          {form.formState.errors.config?.options?.[i] && (
            <p className="text-sm text-destructive">
              {form.formState.errors.config.options[i]?.message}
            </p>
          )}
        </div>
      ))}
      <div className="space-y-2">
        <Label htmlFor="correctAnswer">Correct answer (0–3)</Label>
        <select
          id="correctAnswer"
          {...form.register("config.correctAnswer", {
            valueAsNumber: true,
          })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {[0, 1, 2, 3].map((n) => (
            <option key={n} value={n}>
              Option {n + 1}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create task"}
      </Button>
    </form>
  );
}
