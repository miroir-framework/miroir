/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { type BlockPath } from "miroir-core";
import React, { useCallback, useState } from "react";

import { referencePathOf, useBlockEditing, valueAtPath, withReferencePath, withValueAtPath } from "./BlockEditing.js";
import type { FieldColors } from "./BlockFields.js";

// ################################################################################################
// #501: the path picker of a variable block (getFromContext, getFromParameters). It adds an
// attribute to the path the block reads, from the ML schema of the value when the #249 walk knows
// it, as free text otherwise, and drops the last attribute. One segment is written as
// `referenceName`, more as `referencePath`.
// ################################################################################################

const controlCss = (colors: FieldColors) =>
  css({
    fontFamily: "monospace",
    fontSize: "12px",
    background: colors.field,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: "6px",
    padding: "0 4px",
  });

export function BlockVariablePath(props: { path: BlockPath; id: string; colors: FieldColors }) {
  const editing = useBlockEditing();
  const [text, setText] = useState("");
  const node = editing ? valueAtPath(editing.root, props.path) : undefined;
  const segments = referencePathOf(node);
  const write = useCallback(
    (referencePath: string[]) => {
      const current = editing ? valueAtPath(editing.root, props.path) : undefined;
      if (!editing || typeof current !== "object" || current === null) {
        return;
      }
      editing.commit(
        withValueAtPath(editing.root, props.path, withReferencePath(current as Record<string, unknown>, referencePath)),
      );
    },
    [editing, props.path],
  );
  if (!editing || segments.length === 0) {
    return null;
  }
  const readsContext = (node as { transformerType?: unknown }).transformerType === "getFromContext";
  const attributes = readsContext ? editing.attributesAt(props.path, segments) : undefined;
  const add = (segment: string) => {
    if (segment.length > 0) {
      write([...segments, segment]);
    }
  };
  return (
    <span
      data-testid={`block-path:${props.id}`}
      data-path={JSON.stringify(segments)}
      onClick={(event) => event.stopPropagation()}
      css={css({ display: "inline-flex", gap: "4px", alignItems: "center" })}
    >
      {attributes ? (
        <select
          data-testid={`block-path-add:${props.id}`}
          aria-label={`Read an attribute of ${segments.join(".")}`}
          value=""
          onChange={(event) => add(event.target.value)}
          css={controlCss(props.colors)}
        >
          <option value="">+ attribute</option>
          {attributes.map((attribute) => (
            <option key={attribute} value={attribute}>
              {attribute}
            </option>
          ))}
        </select>
      ) : (
        <input
          data-testid={`block-path-text:${props.id}`}
          data-own-undo
          aria-label={`Read an attribute of ${segments.join(".")}: type its name, then Enter`}
          placeholder="+ attribute"
          value={text}
          size={10}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(text.trim());
              setText("");
            }
          }}
          css={controlCss(props.colors)}
        />
      )}
      {segments.length > 1 && (
        <button
          type="button"
          data-testid={`block-path-pop:${props.id}`}
          aria-label={`Drop the attribute ${segments[segments.length - 1]}`}
          title={`Drop the attribute ${segments[segments.length - 1]}`}
          onClick={() => write(segments.slice(0, -1))}
          css={[controlCss(props.colors), css({ cursor: "pointer" })]}
        >
          ⌫
        </button>
      )}
    </span>
  );
}
