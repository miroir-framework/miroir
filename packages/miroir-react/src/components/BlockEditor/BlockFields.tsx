/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Popover } from "@mui/material";
import { Formik } from "formik";
import { selfApplicationMiroir } from "miroir-app-miroir";
import {
  defaultSelfApplicationDeploymentMap,
  miroirFundamentalMlSchemaUuid,
  type BlockPath,
  type MlElement,
} from "miroir-core";
import React, { useCallback, useMemo, useState } from "react";

import { TypedValueObjectEditor } from "../Reports/TypedValueObjectEditor.js";
import { ValueHistoryContext } from "../ValueObjectEditor/ValueHistoryProvider.js";
import { useBlockEditing, withValueAtPath } from "./BlockEditing.js";

// ################################################################################################
// #500: the values of the block view, edited in place. A field opens an input on click or Enter;
// Enter or leaving the field writes the value once, Escape cancels; the field is marked
// `data-own-undo`: Ctrl+Z inside it is the browser's undo of the text, not the history's.
// #538: an ML schema chip opens the form editor of the schema in a popover, which keeps its own
// history until Save writes the schema.
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

/** The schema of the value the ML schema popover edits: any ML schema. */
const ML_SCHEMA_FORM_SCHEMA: MlElement = {
  type: "schemaReference",
  definition: { absolutePath: miroirFundamentalMlSchemaUuid, relativePath: "mlElement" },
};

/** Path of the edited schema in the Formik values of the popover's form. */
const ML_SCHEMA_FORM_PATH = "mlSchema";

/**
 * An ML schema given as a value: a chip. When the view edits, it opens the form editor of the
 * schema in a popover (#538), with the JSON switch of the form. Save writes the schema once.
 */
export const MlSchemaChip = React.memo(function MlSchemaChip(props: {
  value: unknown;
  path: BlockPath;
  id: string;
  colors: FieldColors;
}) {
  const editing = useBlockEditing();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = useCallback(() => setAnchor(null), []);
  const save = useCallback(
    async (values: Record<string, unknown>) => {
      close();
      if (!editing) {
        return;
      }
      const schema = values[ML_SCHEMA_FORM_PATH];
      if (JSON.stringify(schema) !== JSON.stringify(props.value)) {
        editing.commit(withValueAtPath(editing.root, props.path, schema));
      }
    },
    [editing, props.value, props.path, close],
  );
  const initialValues = useMemo(() => ({ [ML_SCHEMA_FORM_PATH]: props.value }), [props.value]);
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
  const formLabel = `mlSchema.${props.id}`;
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
        {/* the form keeps its own history: the block view's does not reach into the popover */}
        <ValueHistoryContext.Provider value={undefined}>
          <div
            role="dialog"
            aria-label={`ML schema of ${props.id}`}
            data-testid={`block-mlschema-form:${props.id}`}
            onClick={(event) => event.stopPropagation()}
            // React events bubble through the portal: a submit the form refused (preventDefault
            // only) would reach the form of the editor around the block view and submit it
            onSubmit={(event) => event.stopPropagation()}
            css={css({ display: "flex", flexDirection: "column", gap: "6px", padding: "8px", minWidth: "40ch" })}
          >
            <Formik initialValues={initialValues} onSubmit={save} validateOnChange={false} validateOnBlur={false}>
              {/* mlElement is in Miroir's meta-model, with no foreign keys: Miroir's deployment resolves it in any host */}
              <TypedValueObjectEditor
                labelElement={<span>ML schema</span>}
                formValueMLSchema={ML_SCHEMA_FORM_SCHEMA}
                formikValuePathAsString={ML_SCHEMA_FORM_PATH}
                application={selfApplicationMiroir.uuid}
                applicationDeploymentMap={defaultSelfApplicationDeploymentMap}
                deploymentUuid={defaultSelfApplicationDeploymentMap[selfApplicationMiroir.uuid]}
                applicationSection="model"
                formLabel={formLabel}
                valueObjectEditMode="update"
                displaySubmitButton="noDisplay"
                submitRequiresValidType={true}
                maxRenderDepth={3}
              />
            </Formik>
            <span css={css({ display: "flex", gap: "6px", justifyContent: "flex-end" })}>
              <button type="button" data-testid={`block-mlschema-cancel:${props.id}`} onClick={close}>
                Cancel
              </button>
              {/* submits the form above, so that its checks apply: a schema that is not one is not saved */}
              <button type="submit" form={`form.${formLabel}`} data-testid={`block-mlschema-save:${props.id}`}>
                Save
              </button>
            </span>
          </div>
        </ValueHistoryContext.Provider>
      </Popover>
    </>
  );
});

/**
 * #505: the key of a record entry: renamed in place when the view edits its value (Enter applies,
 * Escape cancels); a refused name stays in the input, marked invalid with the reason as its title.
 */
export const BlockKeyField = React.memo(function BlockKeyField(props: {
  entryKey: string;
  path: BlockPath;
  id: string;
  color: string;
}) {
  const editing = useBlockEditing();
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const [refused, setRefused] = useState<string | undefined>(undefined);
  const keyCss = css({ fontSize: "12px", color: props.color, paddingTop: "3px" });
  if (!editing) {
    return <span css={keyCss}>{props.entryKey}</span>;
  }
  if (draft === undefined) {
    return (
      <span
        role="button"
        tabIndex={0}
        data-testid={`block-key:${props.id}`}
        title={`${props.entryKey}: click to rename`}
        onClick={(event) => {
          event.stopPropagation();
          setDraft(props.entryKey);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            setDraft(props.entryKey);
          }
        }}
        css={[keyCss, css({ cursor: "text" })]}
      >
        {props.entryKey}
      </span>
    );
  }
  const close = () => {
    setDraft(undefined);
    setRefused(undefined);
  };
  return (
    <input
      data-testid={`block-key-input:${props.id}`}
      data-own-undo
      aria-label={`Key of ${props.id}`}
      aria-invalid={refused !== undefined}
      title={refused}
      autoFocus
      value={draft}
      size={Math.max(4, Math.min(30, draft.length + 1))}
      onChange={(event) => {
        setDraft(event.target.value);
        setRefused(undefined);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const error = editing.renameKey(props.path, draft.trim());
          if (error) {
            setRefused(error);
          } else {
            close();
          }
        } else if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
      onClick={(event) => event.stopPropagation()}
      css={css({ font: "inherit", fontSize: "12px", outline: refused ? "2px solid #c62828" : undefined })}
    />
  );
});
