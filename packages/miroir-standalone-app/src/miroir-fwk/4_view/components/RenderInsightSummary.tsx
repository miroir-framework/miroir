import React, { useCallback, useEffect, useState } from "react";
import { useMiroirContextService } from "miroir-react";
import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";
import {
  getRenderInsightMaxDepth,
  setRenderInsightMaxDepth,
} from "../tools/renderInsightMaxDepth.js";
import {
  renderInsightRegistry,
  type RenderInsightNode,
} from "../tools/renderInsightRegistry.js";
import {
  summarizeTree,
  type SummarizedInsightNode,
} from "../tools/renderInsightSummarize.js";
import { getPerformanceConfig } from "../tools/performanceConfig.js";
import { RenderPerformanceMetrics } from "../tools/renderPerformanceMeasure.js";

const EMPTY_STATE =
  "Interact with the report — instrumented components will appear here.";

/**
 * Docked (non-floating) session summary for render insights.
 * Replaces the default DraggableContainer Performance Stats modal.
 */
export const RenderInsightSummary: React.FC = () => {
  const context = useMiroirContextService();
  const { currentTheme } = useMiroirTheme();
  const [maxDepth, setMaxDepthState] = useState(() => getRenderInsightMaxDepth());
  const [nodes, setNodes] = useState<RenderInsightNode[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!context.showPerformanceDisplay) {
      return;
    }
    const poll = () => {
      setNodes(renderInsightRegistry.getSnapshot());
      setMaxDepthState(getRenderInsightMaxDepth());
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => clearInterval(id);
  }, [context.showPerformanceDisplay]);

  const handleMaxDepthChange = useCallback((value: number) => {
    setRenderInsightMaxDepth(value);
    setMaxDepthState(getRenderInsightMaxDepth());
  }, []);

  const handleClear = useCallback(() => {
    renderInsightRegistry.resetAll();
    RenderPerformanceMetrics.resetMetrics();
    setNodes([]);
  }, []);

  const handleExport = useCallback(() => {
    const summarized = summarizeTree(nodes, { maxDepth });
    const exportData = {
      timestamp: new Date().toISOString(),
      maxDepth,
      configuration: getPerformanceConfig(),
      nodes: summarized,
      rawSnapshot: nodes,
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `render-insights-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, maxDepth]);

  if (!context.showPerformanceDisplay) {
    return null;
  }

  const summarized: SummarizedInsightNode[] = summarizeTree(nodes, { maxDepth });
  const totalNav = nodes.reduce((sum, n) => sum + n.navigationCount, 0);

  return (
    <div
      data-testid="render-insight-summary"
      style={{
        border: `1px solid ${currentTheme.colors.warning ?? "#f59e0b"}`,
        borderRadius: currentTheme.borderRadius.sm,
        margin: "8px 0",
        padding: currentTheme.spacing?.sm ?? "8px",
        backgroundColor: currentTheme.colors.warningLight ?? "#fffbeb",
        fontFamily: "monospace",
        fontSize: currentTheme.typography?.fontSize?.sm ?? "13px",
        color: currentTheme.colors.text ?? "#111827",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: collapsed ? 0 : 8,
          borderBottom: collapsed
            ? "none"
            : `1px solid ${currentTheme.colors.divider ?? "#e5e7eb"}`,
          paddingBottom: collapsed ? 0 : 6,
        }}
      >
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand render insight summary" : "Collapse render insight summary"}
          style={{ fontSize: "0.85em", cursor: "pointer" }}
        >
          {collapsed ? "▸" : "▾"} Render insights
        </button>
        <span style={{ color: currentTheme.colors.textSecondary, fontSize: "11px" }}>
          {nodes.length} nodes · Σnav {totalNav}
        </span>
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "11px" }}>
          Max depth
          <input
            type="number"
            aria-label="Max depth"
            min={0}
            step={1}
            value={maxDepth}
            onChange={(e) => handleMaxDepthChange(Number(e.target.value))}
            style={{ width: 48 }}
          />
        </label>
        <button type="button" onClick={handleClear} style={{ fontSize: "0.8em" }}>
          Clear
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={nodes.length === 0}
          style={{ fontSize: "0.8em" }}
        >
          Export JSON
        </button>
      </div>

      {!collapsed && (
        <>
          {nodes.length === 0 ? (
            <div
              style={{
                color: currentTheme.colors.textSecondary,
                fontSize: "12px",
                padding: "8px 0",
              }}
            >
              {EMPTY_STATE}
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {summarized.map((node) => (
                <li
                  key={node.pathKey}
                  style={{
                    fontSize: "11px",
                    color: currentTheme.colors.textSecondary,
                  }}
                >
                  <strong style={{ color: currentTheme.colors.text }}>
                    {node.componentId}
                    {node.formikPath ? ` @${node.formikPath}` : ""}
                  </strong>{" "}
                  ×{node.navigationCount} · Σ{node.totalCount}
                  {node.aggregate && (
                    <span>
                      {" "}
                      · ▾ {node.aggregate.descendantCount} below · avg{" "}
                      {node.aggregate.avgNavigationRenders.toFixed(1)} · min{" "}
                      {node.aggregate.min.path} ×{node.aggregate.min.navigationCount} · max{" "}
                      {node.aggregate.max.path} ×{node.aggregate.max.navigationCount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
