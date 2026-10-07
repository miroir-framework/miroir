/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { getIn, useFormikContext } from "formik";
import { runnerHat } from "miroir-core";
import React, { lazy, Suspense, useCallback, useContext, useMemo } from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import type { TransformerTypeBadge } from "../ValueObjectEditor/MlElementEditorInterface.js";
import { switchButtonCss, ValueHistoryButtons } from "../ValueObjectEditor/ValueHistoryButtons.js";
import { ValueHistoryContext, ValueHistoryScope } from "../ValueObjectEditor/ValueHistoryProvider.js";
import { useBlockDefineOfEndpointAction } from "./BlockEndpointAction.js";
import {
  BlockDefineContext,
  BlockRunnerContext,
  BlockViewModeContext,
  type BlockRunner,
  type BlockViewMode,
} from "./BlockViewMode.js";

// ################################################################################################
// #498: the Blocks / Form / JSON switch of a transformer field, and the view it selects. The block
// view loads with its first use, not with the page.
// #499: when an undo history watches the field, Undo and Redo sit next to the switch, whatever the
// view, and the field is the history's scope: Ctrl+Z and Ctrl+Y work inside it.
// #500: the block view edits the field: it writes the whole value once per edit. The type badges
// of the form (#453) are flags on its blocks.
// #503: in a read-only editor, the block view is read-only.
// #505: the `compositeActionSequence` of a custom Runner shows its "when run" hat, its form fields
// read from the Runner value around the field: they are edited in `formMLSchema` there. A test
// sequence offers the assertion action in its palette.
// #506: the `actionImplementation.definition` of a composite Endpoint action is a define block: its
// header lists the action's parameters, read from `payload` in the body. A parameter change writes
// the whole action around the field, in one edit.
// ################################################################################################

const BlockEditorView = lazy(async () => ({ default: (await import("./BlockEditorView.js")).BlockEditorView }));

const MODES: { mode: BlockViewMode; label: string }[] = [
  { mode: "blocks", label: "Blocks" },
  { mode: "form", label: "Form" },
  { mode: "json", label: "JSON" },
];

export interface BlockViewSwitchProps {
  /** Path of the field in the Formik values. */
  formikPath: string;
  /** Path of the field from the form section root: the ids of its blocks start with it. */
  rootLessListKey: string;
  /** The editor is read-only: the block view shows the value and does not edit it (#503). */
  readOnly?: boolean;
  /** The type badges of the editor (#453), shown as flags on the blocks. */
  transformerTypeBadges?: TransformerTypeBadge[];
  /** #505: the field holds a test sequence: the palette offers the assertion action. */
  withTestAssertion?: boolean;
  /** The form editor of the field, in Form or JSON mode. */
  children: (mode: Exclude<BlockViewMode, "blocks">) => React.ReactNode;
}

export function BlockViewSwitch(props: BlockViewSwitchProps) {
  const modes = useContext(BlockViewModeContext);
  const history = useContext(ValueHistoryContext);
  const { currentTheme } = useMiroirTheme();
  const formik = useFormikContext<Record<string, unknown>>();
  const mode = modes?.modeOf(props.formikPath) ?? "form";
  const watched = history?.formikPath === props.formikPath;
  const { setFieldValue } = formik;
  const commit = useCallback(
    (newValue: unknown) => {
      setFieldValue(props.formikPath, newValue, false);
      history?.restoreFocus();
    },
    [setFieldValue, props.formikPath, history],
  );
  // #505: the Runner whose sequence this field is, unless an enclosing editor already shows its hat
  const enclosingRunner = useContext(BlockRunnerContext);
  const segments = props.formikPath.split(".");
  const runnerValue =
    segments[segments.length - 1] === "compositeActionSequence" && segments[segments.length - 2] === "definition"
      ? segments.length > 2
        ? getIn(formik.values, segments.slice(0, -2).join("."))
        : formik.values
      : undefined;
  const instanceRunner = useMemo((): BlockRunner | undefined => {
    const hat = runnerHat(runnerValue);
    return hat ? { rootLessListKey: props.rootLessListKey, ...hat } : undefined;
  }, [runnerValue, props.rootLessListKey]);
  const runner = enclosingRunner?.rootLessListKey === props.rootLessListKey ? enclosingRunner : instanceRunner;
  // #506: the composite Endpoint action whose body this field is, unless an enclosing editor shows its header
  const enclosingDefine = useContext(BlockDefineContext);
  const actionPath =
    segments[segments.length - 1] === "definition" && segments[segments.length - 2] === "actionImplementation"
      ? segments.slice(0, -2).join(".")
      : undefined;
  const actionValue = actionPath === undefined ? undefined : actionPath === "" ? formik.values : getIn(formik.values, actionPath);
  const { setValues } = formik;
  const setAction = useCallback(
    (action: Record<string, unknown>) => {
      if (actionPath === "") {
        setValues(action, false);
      } else if (actionPath !== undefined) {
        setFieldValue(actionPath, action, false);
      }
      history?.restoreFocus();
    },
    [actionPath, setValues, setFieldValue, history],
  );
  const instanceDefine = useBlockDefineOfEndpointAction(actionValue, setAction, props.rootLessListKey);
  const define =
    enclosingDefine?.rootLessListKey === props.rootLessListKey ? enclosingDefine : (instanceDefine ?? enclosingDefine);
  const setTray = modes?.setTray;
  const changeTray = useCallback(
    (update: (tray: unknown[]) => unknown[]) => setTray?.(props.formikPath, update),
    [setTray, props.formikPath],
  );
  const field = (
    <div data-testid={`block-view-switch:${props.rootLessListKey}`}>
      <div css={css({ display: "flex", alignItems: "center", margin: "2px 0 4px" })}>
        <div role="group" aria-label={`View of ${props.rootLessListKey}`} css={css({ display: "inline-flex", gap: "2px" })}>
          {MODES.map((choice) => (
            <button
              key={choice.mode}
              type="button"
              aria-pressed={mode === choice.mode}
              data-testid={`block-view-mode:${props.rootLessListKey}:${choice.mode}`}
              onClick={() => modes?.setMode(props.formikPath, choice.mode)}
              css={switchButtonCss(currentTheme, mode === choice.mode)}
            >
              {choice.label}
            </button>
          ))}
        </div>
        {watched && <ValueHistoryButtons rootLessListKey={props.rootLessListKey} />}
      </div>
      {mode === "blocks" ? (
        <Suspense fallback={<span>Loading block editor...</span>}>
          <BlockDefineContext.Provider value={define}>
            <BlockRunnerContext.Provider value={runner}>
              <BlockEditorView
                value={getIn(formik.values, props.formikPath)}
                rootLessListKey={props.rootLessListKey}
                onCommit={props.readOnly ? undefined : commit}
                undoable={history?.covers(props.formikPath) ?? false}
                tray={modes?.trayOf(props.formikPath)}
                onTrayChange={modes && !props.readOnly ? changeTray : undefined}
                typeBadges={props.transformerTypeBadges}
                withTestAssertion={props.withTestAssertion}
              />
            </BlockRunnerContext.Provider>
          </BlockDefineContext.Provider>
        </Suspense>
      ) : (
        props.children(mode)
      )}
    </div>
  );
  return watched ? <ValueHistoryScope>{field}</ValueHistoryScope> : field;
}
