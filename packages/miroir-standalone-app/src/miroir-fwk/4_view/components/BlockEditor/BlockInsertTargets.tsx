import type { BlockPath, TransformerInsertPosition } from "miroir-core";
import React from "react";

import { useBlockDroppable } from "./BlockDragDrop.js";
import { armedLabel, pathKey, useBlockEditing } from "./BlockEditing.js";

// ################################################################################################
// #500: where a new block can go: an empty slot, the end of a list slot, a new record entry. A
// click puts the armed palette type or tray block there; a drop puts the dragged one.
// ################################################################################################

function InsertTarget(props: { position: TransformerInsertPosition; id: string; color: string }) {
  const editing = useBlockEditing();
  const { setNodeRef, isOver } = useBlockDroppable(`drop:insert:${props.id}`, {
    kind: "insert",
    path: props.position.path,
  });
  if (!editing) {
    return null;
  }
  const armed = editing.armed;
  // an armed variable shows only the targets where its name is visible
  if (armed && !editing.accepts(armed, props.position.path)) {
    return null;
  }
  const label = armed
    ? `Put ${armedLabel(armed)} here`
    : "Choose a block in the palette or the tray, then click here to put it, or drop a block here";
  return (
    <button
      ref={setNodeRef}
      type="button"
      data-testid={`block-insert:${props.id}`}
      data-insert-kind={props.position.kind}
      aria-label={label}
      title={label}
      disabled={!armed}
      onClick={(event) => {
        event.stopPropagation();
        if (armed) {
          editing.insertAt(armed, props.position.path);
        }
      }}
      style={{
        font: "inherit",
        fontSize: "12px",
        minWidth: "48px",
        height: "20px",
        padding: "0 6px",
        border: `1px dashed ${props.color}`,
        borderRadius: "6px",
        background: isOver ? "rgba(25,118,210,.25)" : "transparent",
        color: "inherit",
        cursor: armed ? "pointer" : "default",
        opacity: armed || isOver ? 1 : 0.6,
      }}
    >
      {props.position.kind === "slot" ? "" : "+"}
    </button>
  );
}

/** The insert targets of the positions in `container`. */
export function BlockInsertTargets(props: { container: BlockPath; idOf: (path: BlockPath) => string; color: string }) {
  const editing = useBlockEditing();
  const positions = editing?.insertPositions.get(pathKey(props.container));
  if (!positions) {
    return null;
  }
  return (
    <>
      {positions.map((position) => (
        <InsertTarget key={pathKey(position.path)} position={position} id={props.idOf(position.path)} color={props.color} />
      ))}
    </>
  );
}
