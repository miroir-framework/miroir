/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { getIn, useFormikContext } from "formik";
import React, { lazy, Suspense, useCallback, useContext } from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import type { TransformerTypeBadge } from "../ValueObjectEditor/MlElementEditorInterface.js";
import { switchButtonCss, ValueHistoryButtons } from "../ValueObjectEditor/ValueHistoryButtons.js";
import { ValueHistoryContext, ValueHistoryScope } from "../ValueObjectEditor/ValueHistoryProvider.js";
import { BlockViewModeContext, type BlockViewMode } from "./BlockViewMode.js";

// ################################################################################################
// #498: the Blocks / Form / JSON switch of a transformer field, and the view it selects. The block
// view loads with its first use, not with the page.
// #499: when an undo history watches the field, Undo and Redo sit next to the switch, whatever the
// view, and the field is the history's scope: Ctrl+Z and Ctrl+Y work inside it.
// #500: the block view edits the field: it writes the whole value once per edit. The type badges
// of the form (#453) are flags on its blocks.
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
  /** The type badges of the editor (#453), shown as flags on the blocks. */
  transformerTypeBadges?: TransformerTypeBadge[];
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
          <BlockEditorView
            value={getIn(formik.values, props.formikPath)}
            rootLessListKey={props.rootLessListKey}
            onCommit={commit}
            undoable={history?.covers(props.formikPath) ?? false}
            tray={modes?.trayOf(props.formikPath)}
            onTrayChange={modes ? changeTray : undefined}
            typeBadges={props.transformerTypeBadges}
          />
        </Suspense>
      ) : (
        props.children(mode)
      )}
    </div>
  );
  return watched ? <ValueHistoryScope>{field}</ValueHistoryScope> : field;
}
