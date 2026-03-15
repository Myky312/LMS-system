import type { Task } from "@/types/domain";

/**
 * Summary for task list card. Do not use JSON.stringify(config).
 * QUIZ → first line of question; AUDIO → instructions or "Audio task" + maxDuration; PHOTO → instructions or "Photo task" + N elements.
 */
export function getTaskSummary(task: Task): { title: string; subtitle?: string } {
  switch (task.type) {
    case "QUIZ": {
      const config = task.config;
      const question =
        typeof config.question === "string" && config.question.trim()
          ? config.question.trim()
          : "Quiz task";
      const firstLine = question.split("\n")[0];
      return {
        title: firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine,
      };
    }
    case "AUDIO": {
      const config = task.config;
      const title =
        config.instructions?.trim() || "Audio task";
      const subtitle =
        config.maxDuration != null && config.maxDuration > 0
          ? `max ${config.maxDuration} sec`
          : undefined;
      return { title, subtitle };
    }
    case "PHOTO": {
      const config = task.config;
      const title =
        config.instructions?.trim() || "Photo task";
      const count = config.requiredElements?.length ?? 0;
      const subtitle =
        count > 0 ? `${count} element${count === 1 ? "" : "s"}` : undefined;
      return { title, subtitle };
    }
    default: {
      const _: never = task;
      return { title: "Task" };
    }
  }
}
