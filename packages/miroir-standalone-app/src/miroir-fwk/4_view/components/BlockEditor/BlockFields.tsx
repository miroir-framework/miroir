/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Popover } from "@mui/material";
import { type BlockPath } from "miroir-core";
import React, { useCallback, useState } from "react";

import { useBlockEditing, withValueAtPath } from "./BlockEditing.js";

// ################################################################################################
// #500: the values of the block view, edited in place. A field opens an input on click or Enter;
// Enter or leaving the field writes the value once, Escape cancels. An ML schema chip opens its
// JSON text in a popover. Both are marked `data-own-undo`: Ctrl+Z inside them is the browser's
// undo of the text, not the history's.
// ################################################################################################

export interface FieldColors {
  field: string;
  text: string;
  border: string;
  literal: string;
}

/** The value a field's text stands for: a string field stays a string, others are JSON. */
export function parseFieldText(text: string, original: unknown): { ok: true; value: unknown } | { ok: false } {
  if (typeof original === "string") {
    return { ok: true, value: text };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

const fieldCss = (colors: FieldColors) =>
  css({
    fontFamily: "monospace",
    fontSize: "12px",
    background: colors.field,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: "6px",
    padding: "0 6px",
    maxWidth: "40ch",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  });

/** A primitive or JSON value of a block: editable at `path` when the view edits its value. */
export const BlockField = React.memo(function BlockField(props: {
  value: unknown;
  path: BlockPath;
  id: string;
  colors: FieldColors;
}) {
  const editing = useBlockEditing();
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const [invalid, setInvalid] = useState(false);
  const text = JSON.stringify(props.value);
  const open = useCallback(() => {
    setDraft(textOf(props.value));
    setInvalid(false);
  }, [props.value]);
  const close = useCallback(() => {
    setDraft(undefined);
    setInvalid(false);
  }, []);
  const save = useCallback(() => {
    if (draft === undefined || !editing) {
      return;
    }
    const parsed = parseFieldText(draft, props.value);
    if (!parsed.ok) {
      setInvalid(true);
      return;
    }
    close();
    if (JSON.stringify(parsed.value) !== text) {
      editing.commit(withValueAtPath(editing.root, props.path, parsed.value));
    }
  }, [draft, editing, props.value, props.path, text, close]);
  if (!editing) {
    return (
      <span title={text} css={fieldCss(props.colors)}>
        {text}
      </span>
    );
  }
  if (draft === undefined) {
    return (
      <span
        role="button"
        tabIndex={0}
        data-testid={`block-field:${props.id}`}
        title={`${text}: click to edit`}
        onClick={(event) => {
          event.stopPropagation();
          open();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            open();
          }
        }}
        css={[fieldCss(props.colors), css({ cursor: "text" })]}
      >
        {text}
      </span>
    );
  }
  return (
    <input
      data-testid={`block-field-input:${props.id}`}
      data-own-undo
      aria-label={`Value of ${props.id}`}
      aria-invalid={invalid}
      title={invalid ? "Not a JSON value" : undefined}
      autoFocus
      value={draft}
      size={Math.max(4, Math.min(40, draft.length + 1))}
      onChange={(event) => {
        setDraft(event.target.value);
        setInvalid(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          save();
        } else if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
      onBlur={save}
      onClick={(event) => event.stopPropagation()}
      css={[fieldCss(props.colors), css({ outline: invalid ? "2px solid #c62828" : undefined })]}
    />
  );
});

/** An ML schema given as a value: a chip, whose JSON text a popover edits when the view edits. */
export const MlSchemaChip = React.memo(function MlSchemaChip(props: {
  value: unknown;
  path: BlockPath;
  id: string;
  colors: FieldColors;
}) {
  const editing = useBlockEditing();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const close = useCallback(() => {
    setAnchor(null);
    setInvalid(false);
  }, []);
  const save = useCallback(() => {
    if (!editing) {
      return;
    }
    const parsed = parseFieldText(draft, props.value);
    if (!parsed.ok) {
      setInvalid(true);
      return;
    }
    close();
    editing.commit(withValueAtPath(editing.root, props.path, parsed.value));
  }, [draft, editing, props.value, props.path, close]);
  const chipCss = css({
    font: "inherit",
    fontSize: "12px",
    color: props.colors.text,
    background: props.colors.literal,
    border: `1px solid ${props.colors.border}`,
    borderRadius: "999px",
    padding: "1px 8px",
  });
  const schemaText = JSON.stringify(props.value, null, 2);
  if (!editing) {
    return (
      <span data-testid={`block:${props.id}`} data-block-kind="mlSchema" title={schemaText} css={chipCss}>
        ML schema
      </span>
    );
  }
  return (
    <>
      <button
        type="button"
        data-testid={`block:${props.id}`}
        data-block-kind="mlSchema"
        title={schemaText}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.stopPropagation();
          setDraft(schemaText);
          setInvalid(false);
          setAnchor(event.currentTarget);
        }}
        css={[chipCss, css({ cursor: "pointer" })]}
      >
        ML schema
      </button>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div
          role="dialog"
          aria-label={`ML schema of ${props.id}`}
          data-own-undo
          css={css({ display: "flex", flexDirection: "column", gap: "6px", padding: "8px" })}
        >
          <textarea
            data-testid={`block-mlschema-input:${props.id}`}
            aria-label="ML schema"
            aria-invalid={invalid}
            autoFocus
            value={draft}
            rows={Math.min(16, draft.split("\n").length + 1)}
            cols={40}
            onChange={(event) => {
              setDraft(event.target.value);
              setInvalid(false);
            }}
            css={css({ fontFamily: "monospace", fontSize: "12px" })}
          />
          {invalid && <span css={css({ color: "#c62828", fontSize: "12px" })}>Not a JSON value</span>}
          <span css={css({ display: "flex", gap: "6px", justifyContent: "flex-end" })}>
            <button type="button" data-testid={`block-mlschema-cancel:${props.id}`} onClick={close}>
              Cancel
            </button>
            <button type="button" data-testid={`block-mlschema-save:${props.id}`} onClick={save}>
              Save
            </button>
          </span>
        </div>
      </Popover>
    </>
  );
});
