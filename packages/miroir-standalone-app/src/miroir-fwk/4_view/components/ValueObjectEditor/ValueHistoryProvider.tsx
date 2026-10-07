import { getIn, useFormikContext } from "formik";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import type { ValueHistory } from "./ValueHistory.js";

// ################################################################################################
// #499 (analysis #497, G2): undo and redo of the value at one Formik path, shared by every view
// that edits it (Blocks, Form, JSON). The provider reports the value to its ValueHistory on each
// render, so every write is recorded the same way: setFieldValue, the `getFieldProps` handlers of
// text inputs, effects and the JSON box. Undo and redo write the restored value with setFieldValue.
//
// The keyboard works inside a ValueHistoryScope, the element of the watched field: Ctrl+Z (Cmd+Z)
// undoes, Ctrl+Y and Ctrl+Shift+Z (Cmd+Shift+Z) redo. Consecutive edits typed into one text field
// make one step.
// ################################################################################################

export interface ValueHistoryActions {
  /** Formik path of the watched value. */
  formikPath: string;
  /** Whether the value at `formikPath` is the watched value or a part of it, so undo restores it. */
  covers: (formikPath: string) => boolean;
  undo: () => void;
  redo: () => void;
  /** The next change was typed into `target`: changes typed into the same field make one step. */
  markTyped: (target: EventTarget) => void;
  /** Ends the current typing group. */
  closeGroup: () => void;
  /**
   * After an edit that may unmount the focused element (remove, unwrap, undo), puts the focus back
   * on the scope when it was lost, so that Ctrl+Z still reaches the history.
   */
  restoreFocus: () => void;
  /** The scope element, whose keyboard events reach the history. */
  setScopeElement: (element: HTMLElement | null) => void;
}

export interface ValueHistoryStatus {
  canUndo: boolean;
  canRedo: boolean;
  /**
   * Whether the scope of the watched field is on screen. It is not when the value fails its type
   * check (the editor shows an error in place of the field): the buttons are then shown outside it.
   */
  scopeShown: boolean;
}

/** Stable while the provider's history and path stay the same. */
export const ValueHistoryContext = createContext<ValueHistoryActions | undefined>(undefined);
/** Changes only when undo or redo becomes possible or impossible. */
export const ValueHistoryStatusContext = createContext<ValueHistoryStatus>({
  canUndo: false,
  canRedo: false,
  scopeShown: false,
});

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
  // the text field the change being rendered was typed into, used once
  const typedInto = useRef<EventTarget | undefined>(undefined);
  const scopeElement = useRef<HTMLElement | null>(null);
  const [scopeShown, setScopeShown] = useState(false);

  const typed = typedInto.current;
  typedInto.current = undefined;
  history.observe(getIn(formik.values, formikPath), typed);

  const restoreFocus = useCallback(() => {
    setTimeout(() => {
      const scope = scopeElement.current;
      const active = document.activeElement;
      if (scope?.isConnected && (!active || active === document.body || !active.isConnected)) {
        scope.focus({ preventScroll: true });
      }
    }, 0);
  }, []);
  const write = useCallback(
    (step: { value: unknown } | undefined) => {
      typedInto.current = undefined;
      if (!step) {
        return;
      }
      void setFieldValue(formikPath, step.value);
      restoreFocus();
    },
    [formikPath, setFieldValue, restoreFocus],
  );
  const undo = useCallback(() => write(history.undo()), [history, write]);
  const redo = useCallback(() => write(history.redo()), [history, write]);
  const actions = useMemo<ValueHistoryActions>(
    () => ({
      formikPath,
      covers: (path: string) => path === formikPath || path.startsWith(`${formikPath}.`),
      undo,
      redo,
      markTyped: (target: EventTarget) => {
        typedInto.current = target;
      },
      closeGroup: () => {
        typedInto.current = undefined;
        history.closeGroup();
      },
      restoreFocus,
      setScopeElement: (element: HTMLElement | null) => {
        scopeElement.current = element;
        setScopeShown(element !== null);
      },
    }),
    [formikPath, history, undo, redo, restoreFocus],
  );
  const { canUndo, canRedo } = history;
  const status = useMemo<ValueHistoryStatus>(
    () => ({ canUndo, canRedo, scopeShown }),
    [canUndo, canRedo, scopeShown],
  );

  return (
    <ValueHistoryContext.Provider value={actions}>
      <ValueHistoryStatusContext.Provider value={status}>{props.children}</ValueHistoryStatusContext.Provider>
    </ValueHistoryContext.Provider>
  );
}

// ################################################################################################
const TEXT_INPUT_TYPES = new Set(["text", "search", "url", "tel", "email", "password", "number"]);

/**
 * A field whose typing makes one undo step: a textarea, a text input or a contenteditable element
 * (CodeMirror). A select's filter input (`role="combobox"`) is not one: its text is not the value.
 */
function isTextField(target: EventTarget | null): target is HTMLElement {
  const element = target as HTMLElement | null;
  if (!element || typeof element.tagName !== "string" || element.getAttribute("role") === "combobox") {
    return false;
  }
  if (element.isContentEditable || element.tagName === "TEXTAREA") {
    return true;
  }
  return element.tagName === "INPUT" && TEXT_INPUT_TYPES.has((element as HTMLInputElement).type);
}

/** Text changes that are not typing: each one is a step of its own. */
const NOT_TYPED = new Set([
  "insertFromPaste",
  "insertFromPasteAsQuotation",
  "insertFromDrop",
  "insertFromYank",
  "deleteByCut",
  "deleteByDrag",
]);

/**
 * Whether an `input` event types or deletes text: "typed", a paste, cut or drop: "pasted", else
 * undefined (a checkbox or a select fires `input` events with no `inputType`; a native undo has
 * the type `historyUndo`).
 */
function textInputKind(event: Event): "typed" | "pasted" | undefined {
  const inputType = (event as InputEvent).inputType;
  if (typeof inputType !== "string" || !(inputType.startsWith("insert") || inputType.startsWith("delete"))) {
    return undefined;
  }
  return NOT_TYPED.has(inputType) ? "pasted" : "typed";
}

/** The virtual key codes of Z and Y, for layouts whose letters are not Latin (Cyrillic, Greek…). */
const KEY_CODE_LETTERS: Record<number, string> = { 89: "y", 90: "z" };

/** The history command of a key: Ctrl/Cmd+Z undoes, Ctrl+Y and Ctrl/Cmd+Shift+Z redo. */
export function historyCommand(event: React.KeyboardEvent): "undo" | "redo" | undefined {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) {
    return undefined;
  }
  // `key` first: the Z key of an AZERTY keyboard has the code KeyW; the key code for the others,
  // as the browser's own undo shortcut does
  const key = event.key.toLowerCase();
  const letter = /^[a-z]$/.test(key) ? key : KEY_CODE_LETTERS[event.nativeEvent.keyCode];
  if (letter === "z") {
    return event.shiftKey ? "redo" : "undo";
  }
  return letter === "y" && !event.shiftKey ? "redo" : undefined;
}

/**
 * Whether a key goes to the text of a field that is not the value: the filter of an open select,
 * or a CodeMirror panel (search). The browser's own undo applies there.
 */
export function editsOwnText(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element.getAttribute !== "function") {
    return false;
  }
  return (
    (element.getAttribute("role") === "combobox" && element.getAttribute("aria-expanded") === "true") ||
    element.closest(".cm-panels") !== null
  );
}

/** Whether a React event comes from inside the element, not from a portal (menu, dialog) below it. */
function fromInside(event: React.SyntheticEvent): boolean {
  return event.currentTarget.contains(event.target as Node);
}

/**
 * The element of the watched field: its keyboard shortcuts and typing reach the history. It takes
 * the focus when a click lands on a part that cannot, and after an edit unmounted the focused
 * element, so that Ctrl+Z still works.
 */
export function ValueHistoryScope(props: { children: React.ReactNode }) {
  const history = useContext(ValueHistoryContext);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // a key a code editor already handled (CodeMirror outside the history), or from a dialog
      if (!history || event.defaultPrevented || !fromInside(event)) {
        return;
      }
      const command = historyCommand(event);
      if (!command || editsOwnText(event.target)) {
        return;
      }
      // also stops the browser's own undo of the focused field, which would bypass the history
      event.preventDefault();
      event.stopPropagation();
      if (command === "undo") {
        history.undo();
      } else {
        history.redo();
      }
    },
    [history],
  );
  const handleInput = useCallback(
    (event: React.FormEvent) => {
      if (!history || !fromInside(event) || !isTextField(event.target)) {
        return;
      }
      const kind = textInputKind(event.nativeEvent);
      if (kind === "typed") {
        history.markTyped(event.target);
      } else if (kind === "pasted") {
        history.closeGroup();
      }
    },
    [history],
  );

  if (!history) {
    return <>{props.children}</>;
  }
  return (
    <div
      ref={history.setScopeElement}
      tabIndex={-1}
      style={{ outline: "none" }}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onFocus={history.closeGroup}
      onBlur={history.closeGroup}
    >
      {props.children}
    </div>
  );
}
