import React from "react";
import { useMiroirContextService } from "miroir-react";
import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";
import { getPerformanceConfig } from "../tools/performanceConfig.js";
import {
  RENDER_INSIGHT_OVERLAY_ATTR,
  RENDER_INSIGHT_OVERLAY_VALUE,
  getRenderInsightChromeStyle,
  resolveRenderInsightTheme,
  shortenFormikPath,
} from "../tools/renderInsightChrome.js";
import type { RenderInsightAggregate } from "../tools/renderInsightSummarize.js";

export interface RenderInsightHeaderProps {
  componentName: string;
  navigationCount: number;
  totalCount: number;
  /** Optional formik path shown for sibling identity. */
  formikPath?: string;
  /** Subtree summary when this node is the maxDepth boundary. */
  aggregate?: RenderInsightAggregate;
  /** Last render duration (ms); shown when ≥ display threshold. */
  lastRenderTime?: number;
}

function formatAggregate(aggregate: RenderInsightAggregate): string {
  const avg = Number.isInteger(aggregate.avgNavigationRenders)
    ? String(aggregate.avgNavigationRenders)
    : aggregate.avgNavigationRenders.toFixed(1);
  return `▾${aggregate.descendantCount} avg${avg} min×${aggregate.min.navigationCount} max×${aggregate.max.navigationCount}`;
}

/**
 * Compact render-insight chip (timer mode).
 * Styling from `theme.components.renderInsight` — same pattern as appBar/tooltip.
 */
export const RenderInsightHeader: React.FC<RenderInsightHeaderProps> = ({
  componentName,
  navigationCount,
  totalCount,
  formikPath,
  aggregate,
  lastRenderTime,
}) => {
  const context = useMiroirContextService();
  const { currentTheme } = useMiroirTheme();

  if (!context.showPerformanceDisplay) {
    return null;
  }

  const chrome = resolveRenderInsightTheme(currentTheme);
  const shortPath = shortenFormikPath(formikPath);
  const threshold = getPerformanceConfig().renderThresholdMs;
  const showTiming =
    typeof lastRenderTime === "number" &&
    Number.isFinite(lastRenderTime) &&
    lastRenderTime >= threshold;

  return (
    <div
      data-testid="render-insight-header"
      title={formikPath && formikPath.length > 0 ? `${componentName} @ ${formikPath}` : componentName}
      {...{ [RENDER_INSIGHT_OVERLAY_ATTR]: RENDER_INSIGHT_OVERLAY_VALUE }}
      style={getRenderInsightChromeStyle(chrome, { compact: true })}
    >
      <span
        data-testid="render-insight-badge"
        style={{
          backgroundColor: chrome.badgeBackground,
          color: chrome.badgeTextColor,
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          padding: "0 5px",
          borderRadius: "999px",
          lineHeight: "18px",
        }}
      >
        perf
      </span>
      <span style={{ fontWeight: 700 }}>{componentName}</span>
      {shortPath ? (
        <span style={{ color: chrome.textMuted, fontWeight: 500 }}>{shortPath}</span>
      ) : null}
      <span
        style={{
          color: chrome.textColor,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ×{navigationCount}
        <span style={{ color: chrome.textMuted, fontWeight: 500 }}> Σ{totalCount}</span>
        {showTiming ? (
          <span style={{ color: chrome.textMuted, fontWeight: 600 }}>
            {" "}
            {lastRenderTime!.toFixed(1)}ms
          </span>
        ) : null}
      </span>
      {aggregate && (
        <span
          data-testid="render-insight-aggregate"
          style={{
            color: chrome.textMuted,
            fontWeight: 500,
          }}
        >
          {formatAggregate(aggregate)}
        </span>
      )}
    </div>
  );
};
