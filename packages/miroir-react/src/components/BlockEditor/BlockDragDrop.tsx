/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { BlockPath } from "miroir-core";
import React, { useCallback, useState } from "react";

import { armedLabel, pathKey, useBlockEditing, valueAtPath, type ArmedBlock, type BlockEditing } from "./BlockEditing.js";

// ################################################################################################
// #500: drag and drop in the block view, with @dnd-kit/core (loaded with the block view only).
// Every drop calls what a menu or a click calls: palette entries and tray blocks drop on an insert
// target (as a click there) or on a block (Replace with); a block drops on an insert target (a
// move) or on the tray (Move to tray). A drag starts after the pointer moves a few pixels, so a
// click on a palette entry, a block header or a tray block keeps its meaning.
// ################################################################################################

/** What is dragged: a palette type, a tray block or a block of the value. */
export type DragSource = ArmedBlock | { kind: "block"; path: BlockPath };

/** Where it is dropped. */
export type DropTarget = { kind: "insert"; path: BlockPath } | { kind: "replace"; path: BlockPath } | { kind: "tray" };

/** Applies a drop with the editing functions the menus use; a drop that means nothing is ignored. */
export function applyBlockDrop(editing: BlockEditing, source: DragSource, target: DropTarget): void {
  if (source.kind === "block") {
    if (target.kind === "tray") {
      editing.moveToTray(source.path);
      return;
    }
    if (target.kind === "insert") {
      try {
        editing.moveBlock(source.path, target.path);
      } catch {
        // into itself: nothing to move
      }
    }
    return;
  }
  if (target.kind === "insert") {
    editing.insertAt(source, target.path);
  } else if (target.kind === "replace") {
    // a change needing a confirmation (no undo history) is not applied by a drop
    editing.replaceAt(source, target.path);
  }
}

function sourceLabel(editing: BlockEditing | undefined, source: DragSource): string {
  if (source.kind !== "block") {
    return armedLabel(source);
  }
  const node = editing ? valueAtPath(editing.root, source.path) : undefined;
  return typeof node === "object" && node !== null && "transformerType" in node
    ? String((node as { transformerType: unknown }).transformerType)
    : "block";
}

/** The innermost droppable under the pointer: blocks nest, and the deepest one is meant. */
const innermostUnderPointer: CollisionDetection = (args) => {
  const area = (id: string | number) => {
    const rect = args.droppableRects.get(id);
    return rect ? rect.width * rect.height : Infinity;
  };
  return [...pointerWithin(args)].sort((a, b) => area(a.id) - area(b.id));
};

export function BlockDndContext(props: { children: React.ReactNode; colors: { text: string; border: string; field: string } }) {
  const editing = useBlockEditing();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [dragged, setDragged] = useState<DragSource | undefined>(undefined);
  const onDragStart = useCallback((event: DragStartEvent) => {
    setDragged(event.active.data.current?.source as DragSource | undefined);
  }, []);
  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragged(undefined);
      const source = event.active.data.current?.source as DragSource | undefined;
      const target = event.over?.data.current?.target as DropTarget | undefined;
      if (editing && source && target) {
        applyBlockDrop(editing, source, target);
      }
    },
    [editing],
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={innermostUnderPointer}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragged(undefined)}
    >
      {props.children}
      <DragOverlay dropAnimation={null}>
        {dragged ? (
          <span
            css={css({
              display: "inline-block",
              fontSize: "12px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "6px",
              background: props.colors.field,
              color: props.colors.text,
              border: `1.5px solid ${props.colors.border}`,
              boxShadow: "0 2px 6px rgba(0,0,0,.25)",
            })}
          >
            {sourceLabel(editing, dragged)}
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Makes an element draggable as `source`; nothing when `source` is undefined (read-only). */
export function useBlockDraggable(id: string, source: DragSource | undefined) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id, data: { source }, disabled: !source });
  return { setNodeRef, listeners: source ? listeners : undefined, isDragging };
}

/** Makes an element a drop target; nothing when `target` is undefined (read-only). */
export function useBlockDroppable(id: string, target: DropTarget | undefined) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { target }, disabled: !target });
  return { setNodeRef, isOver: !!target && isOver };
}

/** Whether a block of the value is being dragged: the tray then shows where it can go. */
export function useDraggingBlock(): boolean {
  const { active } = useDndContext();
  return (active?.data.current?.source as DragSource | undefined)?.kind === "block";
}
