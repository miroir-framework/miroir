import React, { useCallback, useRef } from "react";

import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { attachFeedbackGlow, feedbackGlowAttribute, type FeedbackGlowOptions } from "./feedbackGlow.js";

// ################################################################################################
// Feedback glow boundary (#438).
//
// `enabled={true}` makes the wrapper `div` (or, with `target="document"`, the document element)
// an enabled boundary; `enabled={false}` marks it `off`, which turns the glow off for its subtree
// inside an enabled boundary; `"inherit"` leaves the decision to the enclosing boundary.
//
// Attaching and detaching go through a callback ref, not an effect: React calls the previous ref
// with `null` when `enabled` changes and on unmount, then the new ref with the element.
// The wrapper is `display: contents`, so it does not change the layout. Colour and duration come
// from the props, else from the current theme (`components.feedbackGlow`). Only the boundary reads
// the theme: the controls it wraps read nothing, so the glow adds no re-render to them.
// ################################################################################################

export interface FeedbackGlowBoundaryProps extends FeedbackGlowOptions {
  enabled: boolean | "inherit";
  /** `"document"`: the boundary is the document element (the global switch). */
  target?: "element" | "document";
  children?: React.ReactNode;
  style?: React.CSSProperties;
  "data-testid"?: string;
}

export const FeedbackGlowBoundary: React.FC<FeedbackGlowBoundaryProps> = ({
  enabled,
  target = "element",
  color,
  durationMs,
  children,
  style,
  "data-testid": dataTestId,
}) => {
  const detachRef = useRef<(() => void) | undefined>(undefined);
  const themeGlow = useMiroirTheme().currentTheme.components?.feedbackGlow;
  const glowColor = color ?? themeGlow?.color;
  const glowDurationMs = durationMs ?? themeGlow?.durationMs;

  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      detachRef.current?.();
      detachRef.current = undefined;
      if (!element || enabled === "inherit") {
        return;
      }
      const host = target === "document" ? element.ownerDocument.documentElement : element;
      if (enabled) {
        detachRef.current = attachFeedbackGlow(host, { color: glowColor, durationMs: glowDurationMs });
        return;
      }
      host.setAttribute(feedbackGlowAttribute, "off");
      detachRef.current = () => host.removeAttribute(feedbackGlowAttribute);
    },
    [enabled, target, glowColor, glowDurationMs],
  );

  return (
    <div ref={ref} data-testid={dataTestId} style={{ display: "contents", ...style }}>
      {children}
    </div>
  );
};
