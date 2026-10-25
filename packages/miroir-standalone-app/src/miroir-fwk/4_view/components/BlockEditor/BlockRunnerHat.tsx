/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import {
  addRunnerFormField,
  removeRunnerFormField,
  renameRunnerFormField,
  RUNNER_FORM_FIELD_TYPES,
  runnerHat,
} from "miroir-core";
import React, { useMemo, useState } from "react";

import { blockCategoryColor } from "../../contexts/MiroirThemeContext.js";
import { NameField, smallButton, type BlockDefineHeaderColors } from "./BlockDefineHeader.js";
import { useBlockDraggable } from "./BlockDragDrop.js";
import { useBlockEditing } from "./BlockEditing.js";
import type { BlockRunner } from "./BlockViewMode.js";

// ################################################################################################
// #505 (analysis #497, G8): the "when run" hat of a custom Runner's sequence. It names the Runner
// and lists its form fields. A field is a variable of the sequence: a click arms a read of
// `[runner, field]` (getFromParameters, runtime) and a drag takes it, as the palette's variables.
// Where the hat edits the form (the sequence editor), it adds, renames and removes fields; a
// rename rewrites the reads of the sequence, and a field the sequence reads cannot be removed.
// ################################################################################################

/**
 * The hat of the custom Runner `runner` whose sequence is shown at `rootLessListKey`, with the
 * field changes written by `setRunner`; `undefined` when `runner` is no custom Runner.
 */
export function useBlockRunnerOf(
  runner: unknown,
  setRunner: (runner: Record<string, unknown>) => void,
  rootLessListKey: string,
): BlockRunner | undefined {
  return useMemo(() => {
    const hat = runnerHat(runner);
    if (!hat) {
      return undefined;
    }
    const change = (edit: () => Record<string, unknown>): string | undefined => {
      try {
        setRunner(edit());
        return undefined;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };
    return {
      rootLessListKey,
      ...hat,
      addField: (name, type) => change(() => addRunnerFormField(runner, name, type)),
      renameField: (from, to) => change(() => renameRunnerFormField(runner, from, to)),
      removeField: (name) => change(() => removeRunnerFormField(runner, name)),
    };
  }, [runner, setRunner, rootLessListKey]);
}

function RunnerField(props: {
  runner: BlockRunner;
  field: BlockRunner["fields"][number];
  colors: BlockDefineHeaderColors;
  onError: (error: string | undefined) => void;
}) {
  const { runner, field, colors } = props;
  const editing = useBlockEditing();
  const [renaming, setRenaming] = useState(false);
  const path = [runner.name, field.name];
  const { setNodeRef, listeners } = useBlockDraggable(
    `drag:runner:${field.name}`,
    editing ? { kind: "variable", source: "parameters", name: runner.name, path } : undefined,
  );
  const armed =
    editing?.armed?.kind === "variable" &&
    editing.armed.path !== undefined &&
    editing.armed.path.join("\u0000") === path.join("\u0000");
  const renameField = runner.renameField;
  const removeField = runner.removeField;
  return (
    <span
      data-testid={`block-runner-field:${field.name}`}
      data-read={String(field.read)}
      data-type={field.type}
      css={css({ display: "inline-flex", alignItems: "center", gap: "2px" })}
    >
      {renaming && renameField ? (
        <NameField
          testId={`block-runner-name:${field.name}`}
          label={`New name of the form field ${field.name}`}
          initial={field.name}
          colors={colors}
          apply={(to) => renameField(field.name, to)}
          close={() => setRenaming(false)}
          onError={props.onError}
        />
      ) : (
        <button
          ref={setNodeRef}
          {...listeners}
          type="button"
          data-testid={`block-runner-variable:${field.name}`}
          aria-pressed={editing ? armed : undefined}
          title={
            armed
              ? `${field.name}: click an insert target or a replace target of the sequence`
              : `The form field ${field.name} (${field.type}): choose it to read it in the sequence`
          }
          onClick={
            editing
              ? () => editing.arm(armed ? undefined : { kind: "variable", source: "parameters", name: runner.name, path })
              : undefined
          }
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
          {field.name}
        </button>
      )}
      {editing && !renaming && renameField && (
        <button
          type="button"
          data-testid={`block-runner-rename:${field.name}`}
          aria-label={`Rename the form field ${field.name}`}
          title={`Rename the form field ${field.name} and its reads in the sequence`}
          onClick={() => setRenaming(true)}
          css={smallButton}
        >
          ✎
        </button>
      )}
      {editing && !renaming && removeField && (
        <button
          type="button"
          data-testid={`block-runner-remove:${field.name}`}
          aria-label={`Remove the form field ${field.name}`}
          title={field.read ? `The sequence reads ${field.name}: remove its reads first` : `Remove the form field ${field.name}`}
          disabled={field.read}
          onClick={() => props.onError(removeField(field.name))}
          css={smallButton}
        >
          ×
        </button>
      )}
    </span>
  );
}

/** A new form field: its name, applied by Enter, and its type. */
function NewRunnerField(props: {
  addField: (name: string, type: string) => string | undefined;
  colors: BlockDefineHeaderColors;
  close: () => void;
  onError: (error: string | undefined) => void;
}) {
  const [type, setType] = useState<string>(RUNNER_FORM_FIELD_TYPES[0]);
  return (
    <span css={css({ display: "inline-flex", alignItems: "center", gap: "2px" })}>
      <NameField
        testId="block-runner-new"
        label="Name of the new form field"
        initial=""
        colors={props.colors}
        apply={(name) => props.addField(name, type)}
        close={props.close}
        onError={props.onError}
      />
      <select
        data-testid="block-runner-new-type"
        aria-label="Type of the new form field"
        value={type}
        onChange={(event) => setType(event.target.value)}
        css={css({ font: "inherit", fontSize: "11px" })}
      >
        {RUNNER_FORM_FIELD_TYPES.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </span>
  );
}

export function BlockRunnerHat(props: { runner: BlockRunner; colors: BlockDefineHeaderColors }) {
  const { runner, colors } = props;
  const editing = useBlockEditing();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const addField = runner.addField;
  return (
    <div
      data-testid="block-runner-hat"
      data-name={runner.name}
      role="group"
      aria-label={`when ${runner.name} runs`}
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
        // the hat of a Scratch "when … clicked" block
        borderRadius: "18px 18px 4px 4px",
      })}
    >
      <span css={css({ fontSize: "12px", opacity: 0.85 })}>when</span>
      <span data-testid="block-runner-label" css={css({ fontWeight: 700 })}>
        {runner.label}
      </span>
      <span css={css({ fontSize: "12px", opacity: 0.85 })}>runs, with</span>
      {runner.fields.length === 0 && !adding && (
        <span css={css({ fontSize: "12px", opacity: 0.85, fontStyle: "italic" })}>no form field</span>
      )}
      {runner.fields.map((field) => (
        <RunnerField key={field.name} runner={runner} field={field} colors={colors} onError={setError} />
      ))}
      {editing &&
        addField &&
        (adding ? (
          <NewRunnerField addField={addField} colors={colors} close={() => setAdding(false)} onError={setError} />
        ) : (
          <button
            type="button"
            data-testid="block-runner-add"
            aria-label="Add a form field"
            title="Add a form field"
            onClick={() => setAdding(true)}
            css={smallButton}
          >
            + field
          </button>
        ))}
      {error && (
        <span role="alert" data-testid="block-runner-error" css={css({ flexBasis: "100%", fontSize: "11px" })}>
          {error}
        </span>
      )}
    </div>
  );
}
