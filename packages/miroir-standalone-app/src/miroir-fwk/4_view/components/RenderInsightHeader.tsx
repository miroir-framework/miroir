import React from "react";
import { useMiroirContextService } from "miroir-react";
import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";
import type { RenderInsightAggregate } from "../tools/renderInsightSummarize.js";

export interface RenderInsightHeaderProps {
  componentName: string;
  navigationCount: number;
  totalCount: number;
  /** Optional formik path shown for sibling identity. */
  formikPath?: string;
  /** Subtree summary when this node is the maxDepth boundary. */
  aggregate?: RenderInsightAggregate;
}

function formatAggregate(aggregate: RenderInsightAggregate): string {
  const avg = Number.isInteger(aggregate.avgNavigationRenders)
    ? String(aggregate.avgNavigationRenders)
    : aggregate.avgNavigationRenders.toFixed(1);
  const minLabel = aggregate.min.path.includes("@")
    ? aggregate.min.path.split("@").pop()
    : aggregate.min.path;
  const maxLabel = aggregate.max.path.includes("@")
    ? aggregate.max.path.split("@").pop()
    : aggregate.max.path;
  return `▾ ${aggregate.descendantCount} below · avg ${avg} · min ${minLabel} ×${aggregate.min.navigationCount} · max ${maxLabel} ×${aggregate.max.navigationCount}`;
}

/**
 * Inline visual-debug chrome for render counts (timer mode).
 * Sibling to JsonDisplayHelper — not gated by showDebugInfo.
 */
export const RenderInsightHeader: React.FC<RenderInsightHeaderProps> = ({
  componentName,
  navigationCount,
  totalCount,
  formikPath,
  aggregate,
}) => {
  const context = useMiroirContextService();
  const { currentTheme } = useMiroirTheme();

  if (!context.showPerformanceDisplay) {
    return null;
  }

  const borderColor = currentTheme.colors.warning ?? "#f59e0b";
  const bgColor = currentTheme.colors.warningLight ?? "#fffbeb";
  const headerColor = currentTheme.colors.textSecondary ?? "#484746";
  const label =
    formikPath && formikPath.length > 0
      ? `${componentName} ${formikPath}`
      : componentName;

  return (
    <div
      data-testid="render-insight-header"
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: currentTheme.borderRadius.sm,
        margin: "4px 0",
        padding: "4px 8px",
        backgroundColor: bgColor,
        fontFamily: "monospace",
        fontSize: "12px",
        fontWeight: "bold",
        color: headerColor,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span>⏱ {label}</span>
      <span
        style={{
          color: currentTheme.colors.textSecondary,
          fontWeight: "normal",
          fontSize: "11px",
        }}
      >
        ×{navigationCount} · Σ{totalCount}
      </span>
      {aggregate && (
        <span
          data-testid="render-insight-aggregate"
          style={{
            color: currentTheme.colors.textSecondary,
            fontWeight: "normal",
            fontSize: "11px",
          }}
        >
          {formatAggregate(aggregate)}
        </span>
      )}
    </div>
  );
};
