/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { useContext } from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { ValueHistoryContext, ValueHistoryStatusContext } from "./ValueHistoryProvider.js";

// ################################################################################################
// #499: the Undo and Redo buttons of a value history. They sit next to the Blocks / Form / JSON
// switch of the watched field (BlockViewSwitch); when the field is not on screen, because its value
// fails the type check, `ValueHistoryFallbackButtons` shows them above the editor instead, so that
// the edit that broke the value can still be undone.
// ################################################################################################

type Theme = ReturnType<typeof useMiroirTheme>["currentTheme"];

/** The look of the view switch buttons, shared with the history buttons. */
export function switchButtonCss(theme: Theme, selected: boolean) {
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

export function ValueHistoryButtons(props: { rootLessListKey: string }) {
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

/** The history buttons, shown only while the scope of the watched field is not on screen. */
export function ValueHistoryFallbackButtons(props: { rootLessListKey: string }) {
  const { scopeShown } = useContext(ValueHistoryStatusContext);
  return scopeShown ? null : <ValueHistoryButtons rootLessListKey={props.rootLessListKey} />;
}
