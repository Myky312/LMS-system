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
import { useReorderModulesMutation } from "../hooks/use-modules";
import { buildReorderPayload } from "@/lib/utils/reorder";
import type { Module } from "@/types/domain";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ReorderModulesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  modules: Module[];
};

function SortableModuleRow({
  module,
  position,
}: {
  module: Module;
  position: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

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
      <span className="flex-1 font-medium">{module.title}</span>
    </div>
  );
}

export function ReorderModulesDialog({
  open,
  onOpenChange,
  courseId,
  modules,
}: ReorderModulesDialogProps) {
  const [orderedModules, setOrderedModules] = useState<Module[]>(() =>
    [...modules].sort((a, b) => a.orderIndex - b.orderIndex)
  );
  useEffect(() => {
    if (open) {
      setOrderedModules([...modules].sort((a, b) => a.orderIndex - b.orderIndex));
    }
  }, [open, modules]);
  const reorderMutation = useReorderModulesMutation(courseId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const itemIds = useMemo(() => orderedModules.map((m) => m.id), [orderedModules]);
  const hasChanged = useMemo(() => {
    if (orderedModules.length !== modules.length) return true;
    const initialIds = [...modules].sort((a, b) => a.orderIndex - b.orderIndex).map((m) => m.id);
    return initialIds.some((id, i) => id !== orderedModules[i]?.id);
  }, [orderedModules, modules]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedModules((prev) => {
        const oldIndex = prev.findIndex((m) => m.id === active.id);
        const newIndex = prev.findIndex((m) => m.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    try {
      const payload = buildReorderPayload(orderedModules);
      await reorderMutation.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      // Error state: mutation.isError is true; caller can show toast or inline message
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setOrderedModules([...modules].sort((a, b) => a.orderIndex - b.orderIndex));
    }
    onOpenChange(next);
  };

  const isEmpty = orderedModules.length === 0;
  const singleItem = orderedModules.length <= 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Reorder modules</DialogTitle>
        </DialogHeader>
        {reorderMutation.isError && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Failed to save order. Try again.
          </p>
        )}
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">No modules to reorder.</p>
        ) : singleItem ? (
          <p className="text-sm text-muted-foreground">Only one module — order is unchanged.</p>
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
                {orderedModules.map((mod, index) => (
                  <li key={mod.id}>
                    <SortableModuleRow module={mod} position={index} />
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
