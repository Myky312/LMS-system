"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReorderLessonsMutation } from "../hooks/use-lessons";
import { buildReorderPayload } from "@/lib/utils/reorder";
import type { Lesson } from "@/types/domain";
import { GripVertical, Video } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ReorderLessonsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  lessons: Lesson[];
};

function SortableLessonRow({
  lesson,
  position,
}: {
  lesson: Lesson;
  position: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card p-3",
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium text-muted-foreground">#{position + 1}</span>
      <span className="flex-1 font-medium">{lesson.title}</span>
      {lesson.videoUrl && (
        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          <Video className="h-3 w-3" />
          Video
        </span>
      )}
    </div>
  );
}

export function ReorderLessonsDialog({
  open,
  onOpenChange,
  moduleId,
  lessons,
}: ReorderLessonsDialogProps) {
  const [orderedLessons, setOrderedLessons] = useState<Lesson[]>(() =>
    [...lessons].sort((a, b) => a.orderIndex - b.orderIndex)
  );
  useEffect(() => {
    if (open) {
      setOrderedLessons([...lessons].sort((a, b) => a.orderIndex - b.orderIndex));
    }
  }, [open, lessons]);
  const reorderMutation = useReorderLessonsMutation(moduleId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const itemIds = useMemo(() => orderedLessons.map((l) => l.id), [orderedLessons]);
  const hasChanged = useMemo(() => {
    if (orderedLessons.length !== lessons.length) return true;
    const initialIds = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex).map((l) => l.id);
    return initialIds.some((id, i) => id !== orderedLessons[i]?.id);
  }, [orderedLessons, lessons]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedLessons((prev) => {
        const oldIndex = prev.findIndex((l) => l.id === active.id);
        const newIndex = prev.findIndex((l) => l.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    try {
      const payload = buildReorderPayload(orderedLessons);
      await reorderMutation.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      // Error state: mutation.isError is true
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setOrderedLessons([...lessons].sort((a, b) => a.orderIndex - b.orderIndex));
    }
    onOpenChange(next);
  };

  const isEmpty = orderedLessons.length === 0;
  const singleItem = orderedLessons.length <= 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Reorder lessons</DialogTitle>
        </DialogHeader>
        {reorderMutation.isError && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Failed to save order. Try again.
          </p>
        )}
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">No lessons to reorder.</p>
        ) : singleItem ? (
          <p className="text-sm text-muted-foreground">Only one lesson — order is unchanged.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemIds}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-2">
                {orderedLessons.map((lesson, index) => (
                  <li key={lesson.id}>
                    <SortableLessonRow lesson={lesson} position={index} />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasChanged || reorderMutation.isPending || singleItem || isEmpty}
          >
            {reorderMutation.isPending ? "Saving…" : "Save order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
