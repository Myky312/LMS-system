import type { ReorderPayload } from "@/types/domain";

/**
 * Build payload for reorder endpoints from current list order (e.g. after drag-and-drop).
 */
export function buildReorderPayload<T extends { id: string }>(
  items: T[]
): ReorderPayload {
  return {
    items: items.map((item, index) => ({
      id: item.id,
      orderIndex: index,
    })),
  };
}
