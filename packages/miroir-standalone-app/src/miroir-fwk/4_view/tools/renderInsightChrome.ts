/**
 * Shared chrome for render-insight overlays (timer mode).
 * Colors/sizes come from `theme.components.renderInsight` (resolved like appBar/tooltip).
 * Distinct from JsonDisplayHelper visual-debug (full-width amber bars + 🔍).
 */

import type { CSSProperties } from "react";

export const RENDER_INSIGHT_OVERLAY_ATTR = "data-miroir-overlay";
export const RENDER_INSIGHT_OVERLAY_VALUE = "render-insight";

/** Paired marker on JsonDisplayHelper when debug=true (amber / 🔍). */
export const VISUAL_DEBUG_OVERLAY_VALUE = "visual-debug";

/** Matches ResolvedMiroirTheme['components']['renderInsight']. */
export interface RenderInsightThemeSection {
  background: string;
  textColor: string;
  textMuted: string;
  accent: string;
  borderColor: string;
  badgeBackground: string;
  badgeTextColor: string;
  fontSize: string;
  fontSizeSummary: string;
  borderRadius: string;
  borderRadiusSummary: string;
}

/** Defaults when theme section is missing (tests / early boot). */
export const DEFAULT_RENDER_INSIGHT_THEME: RenderInsightThemeSection = {
  background: "#134e4a",
  textColor: "#f0fdfa",
  textMuted: "#99f6e4",
  accent: "#0f766e",
  borderColor: "#0f766e",
  badgeBackground: "#99f6e4",
  badgeTextColor: "#042f2e",
  fontSize: "12px",
  fontSizeSummary: "13px",
  borderRadius: "999px",
  borderRadiusSummary: "6px",
};

export function resolveRenderInsightTheme(theme?: unknown): RenderInsightThemeSection {
  const ri = (
    theme as
      | { components?: { renderInsight?: Partial<RenderInsightThemeSection> } }
      | undefined
      | null
  )?.components?.renderInsight;
  if (!ri) return { ...DEFAULT_RENDER_INSIGHT_THEME };
  return {
    ...DEFAULT_RENDER_INSIGHT_THEME,
    ...ri,
  };
}

export function getRenderInsightChromeStyle(
  section: RenderInsightThemeSection | undefined,
  options?: { compact?: boolean }
): CSSProperties {
  const c = section ?? DEFAULT_RENDER_INSIGHT_THEME;
  const compact = options?.compact ?? true;
  if (compact) {
    return {
      display: "inline-flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "4px",
      width: "fit-content",
      maxWidth: "100%",
      margin: "1px 0 2px",
      padding: "2px 8px 2px 4px",
      borderRadius: c.borderRadius,
      border: `1px solid ${c.borderColor}`,
      backgroundColor: c.background,
      color: c.textColor,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: c.fontSize,
      lineHeight: 1.35,
      fontWeight: 600,
      boxSizing: "border-box",
      verticalAlign: "middle",
    };
  }
  return {
    display: "block",
    width: "100%",
    margin: "8px 0",
    padding: "6px 10px",
    borderRadius: c.borderRadiusSummary,
    border: `1px solid ${c.borderColor}`,
    borderLeft: `4px solid ${c.accent}`,
    backgroundColor: c.background,
    color: c.textColor,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: c.fontSizeSummary,
    lineHeight: 1.4,
    boxSizing: "border-box",
  };
}

/** Short path for chip label — keep last 2 segments; full path via title. */
export function shortenFormikPath(formikPath: string | undefined, maxSegments = 2): string {
  if (!formikPath) return "";
  const parts = formikPath.split(".").filter(Boolean);
  if (parts.length <= maxSegments) return formikPath;
  return "…" + parts.slice(-maxSegments).join(".");
}
