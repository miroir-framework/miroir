/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useState } from "react";

import { blockCategoryColor, type BlockEditorColors } from "../../contexts/MiroirThemeContext.js";
import { useBlockDraggable } from "./BlockDragDrop.js";
import { useBlockEditing, type ArmedBlock } from "./BlockEditing.js";
import type { BlockDefine } from "./BlockViewMode.js";

// ################################################################################################
// #502 (analysis #497): the header of a define block, the body of a composite TransformerDefinition.
// It names the composite and lists its parameters. A parameter is a variable of the body: a click
// arms it and a drag takes it, as the palette's context variables. The header adds, renames and
// removes parameters; a rename rewrites the reads of the body, and a parameter the body reads
// cannot be removed.
// #506: the header of a composite Endpoint action's body: its action type and the attributes of its
// payload, read as `["payload", parameter]`.
// ################################################################################################

export interface BlockDefineHeaderColors {
  text: string;
  border: string;
  field: string;
  blockEditor: BlockEditorColors | undefined;
}

export const smallButton = css({
  font: "inherit",
  fontSize: "11px",
  lineHeight: 1.2,
  padding: "0 4px",
  border: "none",
  borderRadius: "4px",
  background: "rgba(255,255,255,.25)",
  color: "inherit",
  cursor: "pointer",
  "&:disabled": { opacity: 0.45, cursor: "default" },
});

const nameInput = (colors: BlockDefineHeaderColors) =>
  css({
    font: "inherit",
    fontSize: "12px",
    width: "10ch",
    padding: "0 4px",
    border: `1px solid ${colors.border}`,
    borderRadius: "10px",
    color: colors.text,
    background: colors.field,
  });

/** A text field applied by Enter and dropped by Escape; `apply` returns an error message when refused. */
export function NameField(props: {
  testId: string;
  label: string;
  initial: string;
  colors: BlockDefineHeaderColors;
  apply: (name: string) => string | undefined;
  close: () => void;
  onError: (error: string | undefined) => void;
}) {
  const [text, setText] = useState(props.initial);
  return (
    <input
      data-testid={props.testId}
      aria-label={props.label}
      autoFocus
      value={text}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const error = props.apply(text.trim());
          props.onError(error);
          if (!error) {
            props.close();
          }
        } else if (event.key === "Escape") {
          props.onError(undefined);
          props.close();
        }
      }}
      css={nameInput(props.colors)}
    />
  );
}

function DefineParameter(props: {
  define: BlockDefine;
  parameter: { name: string; read: boolean };
  colors: BlockDefineHeaderColors;
  onError: (error: string | undefined) => void;
}) {
  const { define, parameter, colors } = props;
  const { name } = parameter;
  const editing = useBlockEditing();
  const [renaming, setRenaming] = useState(false);
  // #506: an Endpoint action's parameter is read as `["payload", name]`
  const variable: ArmedBlock = define.contextName
    ? { kind: "variable", source: "context", name: define.contextName, path: [define.contextName, name] }
    : { kind: "variable", source: "context", name };
  const { setNodeRef, listeners } = useBlockDraggable(`drag:define:${name}`, editing ? variable : undefined);
  const armed =
    editing?.armed?.kind === "variable" &&
    editing.armed.source === "context" &&
    editing.armed.name === variable.name &&
    (editing.armed.path ?? []).join("\u0000") === (variable.path ?? []).join("\u0000");
  return (
    <span
      data-testid={`block-define-parameter:${name}`}
      data-read={String(parameter.read)}
      css={css({ display: "inline-flex", alignItems: "center", gap: "2px" })}
    >
      {renaming ? (
        <NameField
          testId={`block-define-name:${name}`}
          label={`New name of the parameter ${name}`}
          initial={name}
          colors={colors}
          apply={(to) => define.renameParameter(name, to)}
          close={() => setRenaming(false)}
          onError={props.onError}
        />
      ) : (
        <button
          ref={setNodeRef}
          {...listeners}
          type="button"
          data-testid={`block-define-variable:${name}`}
          aria-pressed={editing ? armed : undefined}
          title={armed ? `${name}: click an insert target of the body` : `The parameter ${name}: choose it to read it in the body`}
          onClick={editing ? () => editing.arm(armed ? undefined : variable) : undefined}
          css={css({
            font: "inherit",
            fontSize: "12px",
            fontWeight: 700,
            padding: "1px 10px",
            border: armed ? `2px solid ${colors.text}` : "1.5px solid rgba(0,0,0,.22)",
            borderRadius: "12px",
            background: blockCategoryColor(colors.blockEditor, "variable"),
            color: "#ffffff",
            cursor: editing ? "pointer" : "default",
            whiteSpace: "nowrap",
            touchAction: "none",
          })}
        >
          {name}
        </button>
      )}
      {editing && !renaming && (
        <>
          <button
            type="button"
            data-testid={`block-define-rename:${name}`}
            aria-label={`Rename the parameter ${name}`}
            title={`Rename the parameter ${name} and its reads in the body`}
            onClick={() => setRenaming(true)}
            css={smallButton}
          >
            ✎
          </button>
          <button
            type="button"
            data-testid={`block-define-remove:${name}`}
            aria-label={`Remove the parameter ${name}`}
            title={parameter.read ? `The body reads ${name}: remove its reads first` : `Remove the parameter ${name}`}
            disabled={parameter.read}
            onClick={() => props.onError(define.removeParameter(name))}
            css={smallButton}
          >
            ×
          </button>
        </>
      )}
    </span>
  );
}

export function BlockDefineHeader(props: { define: BlockDefine; colors: BlockDefineHeaderColors }) {
  const { define, colors } = props;
  const editing = useBlockEditing();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  return (
    <div
      data-testid="block-define"
      data-name={define.name}
      role="group"
      aria-label={`define ${define.name}`}
      css={css({
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "4px 7px",
        padding: "8px 12px 6px",
        marginBottom: "2px",
        background: blockCategoryColor(colors.blockEditor, "unknown"),
        color: "#ffffff",
        border: "1.5px solid rgba(0,0,0,.22)",
        // the hat of a Scratch define block
        borderRadius: "18px 18px 4px 4px",
      })}
    >
      <span css={css({ fontSize: "12px", opacity: 0.85 })}>define</span>
      <span css={css({ fontWeight: 700 })}>{define.name}</span>
      {define.parameters.map((parameter) => (
        <DefineParameter key={parameter.name} define={define} parameter={parameter} colors={colors} onError={setError} />
      ))}
      {editing &&
        (adding ? (
          <NameField
            testId="block-define-new"
            label="Name of the new parameter"
            initial=""
            colors={colors}
            apply={define.addParameter}
            close={() => setAdding(false)}
            onError={setError}
          />
        ) : (
          <button
            type="button"
            data-testid="block-define-add"
            aria-label="Add a parameter"
            title="Add a parameter"
            onClick={() => setAdding(true)}
            css={smallButton}
          >
            + parameter
          </button>
        ))}
      {error && (
        <span role="alert" data-testid="block-define-error" css={css({ flexBasis: "100%", fontSize: "11px" })}>
          {error}
        </span>
      )}
    </div>
  );
}
