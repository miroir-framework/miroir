/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { getIn, useFormikContext } from "formik";
import React, { lazy, Suspense, useContext } from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import {
  ValueHistoryContext,
  ValueHistoryScope,
  ValueHistoryStatusContext,
} from "../ValueObjectEditor/ValueHistoryProvider.js";
import { BlockViewModeContext, type BlockViewMode } from "./BlockViewMode.js";

// ################################################################################################
// #498: the Blocks / Form / JSON switch of a transformer field, and the view it selects. The block
// view loads with its first use, not with the page.
// #499: when an undo history watches the field, Undo and Redo sit next to the switch, whatever the
// view, and the field is the history's scope: Ctrl+Z and Ctrl+Y work inside it.
// ################################################################################################

const BlockEditorView = lazy(async () => ({ default: (await import("./BlockEditorView.js")).BlockEditorView }));

const MODES: { mode: BlockViewMode; label: string }[] = [
  { mode: "blocks", label: "Blocks" },
  { mode: "form", label: "Form" },
  { mode: "json", label: "JSON" },
];

type Theme = ReturnType<typeof useMiroirTheme>["currentTheme"];

function switchButtonCss(theme: Theme, selected: boolean) {
  return css({
    font: "inherit",
    fontSize: "12px",
    padding: "1px 8px",
    cursor: "pointer",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "4px",
    color: selected ? theme.colors.background : theme.colors.text,
    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
    "&:disabled": { cursor: "default", opacity: 0.5 },
  });
}

function ValueHistoryButtons(props: { rootLessListKey: string }) {
  const history = useContext(ValueHistoryContext);
  const { canUndo, canRedo } = useContext(ValueHistoryStatusContext);
  const { currentTheme } = useMiroirTheme();
  if (!history) {
    return null;
  }
  return (
    <div role="group" aria-label="History" css={css({ display: "inline-flex", gap: "2px", marginLeft: "8px" })}>
      <button
        type="button"
        disabled={!canUndo}
        aria-disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        data-testid={`value-history-undo:${props.rootLessListKey}`}
        onClick={history.undo}
        css={switchButtonCss(currentTheme, false)}
      >
        ↶ Undo
      </button>
      <button
        type="button"
        disabled={!canRedo}
        aria-disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        data-testid={`value-history-redo:${props.rootLessListKey}`}
        onClick={history.redo}
        css={switchButtonCss(currentTheme, false)}
      >
        ↷ Redo
      </button>
    </div>
  );
}

export interface BlockViewSwitchProps {
  /** Path of the field in the Formik values. */
  formikPath: string;
  /** Path of the field from the form section root: the ids of its blocks start with it. */
  rootLessListKey: string;
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
          <BlockEditorView value={getIn(formik.values, props.formikPath)} rootLessListKey={props.rootLessListKey} />
        </Suspense>
      ) : (
        props.children(mode)
      )}
    </div>
  );
  return watched ? <ValueHistoryScope>{field}</ValueHistoryScope> : field;
}
