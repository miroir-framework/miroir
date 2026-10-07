import { getIn, useFormikContext } from "formik";
import React, { createContext, useCallback, useMemo } from "react";

import type { ValueHistory } from "./ValueHistory.js";

// ################################################################################################
// #499 (analysis #497, G2): undo and redo of the value at one Formik path, shared by every view
// that edits it (Blocks, Form, JSON). The provider reports the value to its ValueHistory on each
// render, so every write is recorded the same way: setFieldValue, the `getFieldProps` handlers of
// text inputs, effects and the JSON box. Undo and redo write the restored value with setFieldValue.
// ################################################################################################

export interface ValueHistoryActions {
  /** Formik path of the watched value. */
  formikPath: string;
  /** Whether the value at `formikPath` is the watched value or a part of it, so undo restores it. */
  covers: (formikPath: string) => boolean;
  undo: () => void;
  redo: () => void;
}

export interface ValueHistoryStatus {
  canUndo: boolean;
  canRedo: boolean;
}

/** Stable while the provider's history and path stay the same. */
export const ValueHistoryContext = createContext<ValueHistoryActions | undefined>(undefined);
/** Changes only when undo or redo becomes possible or impossible. */
export const ValueHistoryStatusContext = createContext<ValueHistoryStatus>({ canUndo: false, canRedo: false });

export interface ValueHistoryProviderProps {
  history: ValueHistory;
  /** Path of the watched value in the Formik values. */
  formikPath: string;
  children: React.ReactNode;
}

export function ValueHistoryProvider(props: ValueHistoryProviderProps) {
  const { history, formikPath } = props;
  const formik = useFormikContext<Record<string, unknown>>();
  const { setFieldValue } = formik;
  history.observe(getIn(formik.values, formikPath));

  const undo = useCallback(() => {
    const step = history.undo();
    if (step) {
      void setFieldValue(formikPath, step.value);
    }
  }, [history, formikPath, setFieldValue]);
  const redo = useCallback(() => {
    const step = history.redo();
    if (step) {
      void setFieldValue(formikPath, step.value);
    }
  }, [history, formikPath, setFieldValue]);
  const actions = useMemo<ValueHistoryActions>(
    () => ({
      formikPath,
      covers: (path: string) => path === formikPath || path.startsWith(`${formikPath}.`),
      undo,
      redo,
    }),
    [formikPath, undo, redo],
  );
  const { canUndo, canRedo } = history;
  const status = useMemo<ValueHistoryStatus>(() => ({ canUndo, canRedo }), [canUndo, canRedo]);

  return (
    <ValueHistoryContext.Provider value={actions}>
      <ValueHistoryStatusContext.Provider value={status}>
        <div data-testid={`value-history:${formikPath}`}>{props.children}</div>
      </ValueHistoryStatusContext.Provider>
    </ValueHistoryContext.Provider>
  );
}
