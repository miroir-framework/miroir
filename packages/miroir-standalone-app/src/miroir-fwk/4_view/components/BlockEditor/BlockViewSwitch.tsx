/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { getIn, useFormikContext } from "formik";
import React, { lazy, Suspense, useContext } from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { BlockViewModeContext, type BlockViewMode } from "./BlockViewMode.js";

// ################################################################################################
// #498: the Blocks / Form / JSON switch of a transformer field, and the view it selects. The block
// view loads with its first use, not with the page.
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
  /** The form editor of the field, in Form or JSON mode. */
  children: (mode: Exclude<BlockViewMode, "blocks">) => React.ReactNode;
}

export function BlockViewSwitch(props: BlockViewSwitchProps) {
  const modes = useContext(BlockViewModeContext);
  const { currentTheme } = useMiroirTheme();
  const formik = useFormikContext<Record<string, unknown>>();
  const mode = modes?.modeOf(props.formikPath) ?? "form";
  return (
    <div data-testid={`block-view-switch:${props.rootLessListKey}`}>
      <div
        role="group"
        aria-label={`View of ${props.rootLessListKey}`}
        css={css({ display: "inline-flex", gap: "2px", margin: "2px 0 4px" })}
      >
        {MODES.map((choice) => (
          <button
            key={choice.mode}
            type="button"
            aria-pressed={mode === choice.mode}
            data-testid={`block-view-mode:${props.rootLessListKey}:${choice.mode}`}
            onClick={() => modes?.setMode(props.formikPath, choice.mode)}
            css={css({
              font: "inherit",
              fontSize: "12px",
              padding: "1px 8px",
              cursor: "pointer",
              border: `1px solid ${currentTheme.colors.border}`,
              borderRadius: "4px",
              color: mode === choice.mode ? currentTheme.colors.background : currentTheme.colors.text,
              backgroundColor: mode === choice.mode ? currentTheme.colors.primary : currentTheme.colors.surface,
            })}
          >
            {choice.label}
          </button>
        ))}
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
}
