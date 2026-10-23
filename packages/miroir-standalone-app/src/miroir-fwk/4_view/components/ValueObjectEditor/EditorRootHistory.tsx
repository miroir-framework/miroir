/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { getIn, useFormikContext } from "formik";
import React, { useContext, useState } from "react";

import { ValueHistory } from "./ValueHistory.js";
import { ValueHistoryButtons } from "./ValueHistoryButtons.js";
import { ValueHistoryContext, ValueHistoryProvider, ValueHistoryScope } from "./ValueHistoryProvider.js";

// ################################################################################################
// #503 (analysis #497, G2): undo and redo of the whole value an editor root edits, whichever field
// and view (Blocks, Form, JSON) made the edit. Undo and Redo sit above the form, and Ctrl+Z and
// Ctrl+Y work anywhere inside it. An editor inside one that keeps a history (the TransformerEditor)
// keeps none of its own. Another instance in the same editor (its uuid changes) starts a new history.
// ################################################################################################

export interface EditorRootHistoryProps {
  /** Path of the edited value in the Formik values. */
  formikPath: string;
  children: React.ReactNode;
}

export function EditorRootHistory(props: EditorRootHistoryProps) {
  const enclosing = useContext(ValueHistoryContext);
  if (enclosing) {
    return <>{props.children}</>;
  }
  return <RootHistory {...props} />;
}

function instanceUuid(value: unknown): unknown {
  return typeof value === "object" && value !== null ? (value as { uuid?: unknown }).uuid : undefined;
}

function RootHistory(props: EditorRootHistoryProps) {
  const formik = useFormikContext<Record<string, unknown>>();
  const value = getIn(formik.values, props.formikPath);
  const [history] = useState(() => new ValueHistory(value));
  // another instance is a new starting point, not a step: adjusted during render (no effect)
  const uuid = instanceUuid(value);
  const [historyOf, setHistoryOf] = useState(uuid);
  if (historyOf !== uuid) {
    setHistoryOf(uuid);
    history.reset(value);
  }
  return (
    <ValueHistoryProvider history={history} formikPath={props.formikPath}>
      <div data-testid="editor-root-history" css={css({ display: "flex", justifyContent: "flex-end", margin: "2px 0" })}>
        <ValueHistoryButtons rootLessListKey="" />
      </div>
      <ValueHistoryScope>{props.children}</ValueHistoryScope>
    </ValueHistoryProvider>
  );
}
