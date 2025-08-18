import * as React from 'react';
import { DraggableContainer } from '../components/DraggableContainer.js';

// Performance tracking for JzodElementEditor renders
export interface RenderPerformanceMetricsElement {
  renderCount: number;
  totalRenderTime: number;
  lastRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  averageRenderTime: number;
}

const emptyRenderMetrics: RenderPerformanceMetricsElement = {
        renderCount: 0,
        totalRenderTime: 0,
        lastRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: Infinity,
        averageRenderTime: 0
      };
// export const renderMetrics: Record<string, RenderPerformanceMetricsElement> = {};

// ################################################################################################
export class RenderPerformanceMetrics {
  // private static renderMetrics: Record<string, RenderPerformanceMetricsElement> = {};
  static renderMetrics: Record<string, RenderPerformanceMetricsElement> = {};
  static changeCallbacks: (() => void)[] = [];
  static notifyTimer: NodeJS.Timeout | null = null;

  static addChangeCallback(callback: () => void) {
    this.changeCallbacks.push(callback);
  }

  static removeChangeCallback(callback: () => void) {
    this.changeCallbacks = this.changeCallbacks.filter((cb) => cb !== callback);
  }

  static notifyCallbacks() {
    // Throttle notifications to avoid excessive re-renders
    if (this.notifyTimer) {
      return;
    }

    this.notifyTimer = setTimeout(() => {
      // console.log('RenderPerformanceMetrics notifying callbacks, count:', this.changeCallbacks.length);
      this.changeCallbacks.forEach((callback) => callback());
      this.notifyTimer = null;
    }, 100); // Throttle to 100ms
  }

  static resetMetrics() {
    // Clear any pending timer
    if (this.notifyTimer) {
      clearTimeout(this.notifyTimer);
      this.notifyTimer = null;
    }

    this.renderMetrics = this.renderMetrics
      ? Object.fromEntries(
          Object.keys(this.renderMetrics).map((k) => [
            k,
            {
              renderCount: 0,
              totalRenderTime: 0,
              lastRenderTime: 0,
              maxRenderTime: 0,
              minRenderTime: Infinity,
              averageRenderTime: 0,
            },
          ])
        )
      : {};
    this.notifyCallbacks();
  }
  // static trackRender(componentKey: string, renderTime: number): RenderPerformanceMetricsElement {
  //   return trackRenderPerformance(componentKey, renderTime);
  // }
  // Function to track render performance
  static trackRenderPerformance(
    componentKey: string,
    renderTime: number
  ): RenderPerformanceMetricsElement {
    if (!this.renderMetrics[componentKey]) {
      this.renderMetrics[componentKey] = emptyRenderMetrics;
    }

    const metrics = this.renderMetrics[componentKey];
    metrics.renderCount++;
    metrics.totalRenderTime += renderTime;
    metrics.lastRenderTime = renderTime;
    metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime);
    metrics.minRenderTime = Math.min(metrics.minRenderTime, renderTime);
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;

    this.notifyCallbacks();
    return metrics;
  }

  // Component to display render performance metrics
  static RenderPerformanceDisplay = ({
    componentKey,
    indentLevel,
  }: {
    componentKey: string;
    indentLevel?: number;
  }) => {
    const metrics = this.renderMetrics[componentKey];

    if (!metrics) return null;

    return (
      <div
        style={{
          fontSize: "0.7rem",
          color: "#666",
          backgroundColor: "rgba(255, 255, 0, 0.1)",
          padding: "2px 4px",
          margin: "1px 0",
          border: "1px solid #ddd",
          borderRadius: "3px",
          fontFamily: "monospace",
          marginLeft: `${(indentLevel || 0) * 10}px`,
        }}
      >
        <strong>{componentKey}:</strong> #{metrics.renderCount} | Last:{" "}
        {metrics.lastRenderTime.toFixed(2)}ms | Total: {metrics.totalRenderTime.toFixed(2)}ms | Avg:{" "}
        {metrics.averageRenderTime.toFixed(2)}ms | Min/Max: {metrics.minRenderTime.toFixed(2)}ms/
        {metrics.maxRenderTime.toFixed(2)}ms
      </div>
    );
  };
  // Global performance summary display - now uses the standalone DraggableContainer
  static GlobalRenderPerformanceDisplay = DraggableContainer;

  // Specific render metrics display component
  static RenderMetricsContent = () => {
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    React.useEffect(() => {
      // Subscribe to metrics changes
      RenderPerformanceMetrics.addChangeCallback(forceUpdate);
      
      return () => {
        // Cleanup subscription
        RenderPerformanceMetrics.removeChangeCallback(forceUpdate);
      };
    }, []);

    // Read directly from the static renderMetrics
    const renderMetrics = RenderPerformanceMetrics.renderMetrics;

    const totalRenders = Object.values(renderMetrics).reduce(
      (sum, metrics) => sum + metrics.renderCount,
      0
    );
    const totalTime = Object.values(renderMetrics).reduce(
      (sum, metrics) => sum + metrics.totalRenderTime,
      0
    );
    const averageTime = totalRenders > 0 ? totalTime / totalRenders : 0;

    if (totalRenders === 0) return <div>No stats yet!</div>;

    return (
      <>
        <div style={{ marginBottom: "8px", padding: "4px 0", borderBottom: "1px solid #eee" }}>
          <div>
            Total Renders: {totalRenders} | Total Time: {totalTime.toFixed(2)}ms | Avg:{" "}
            {averageTime.toFixed(2)}ms
          </div>
          <div>Active Components: {Object.keys(renderMetrics).length}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {Object.entries(renderMetrics)
            .sort(([, a], [, b]) => (b as RenderPerformanceMetricsElement).totalRenderTime - (a as RenderPerformanceMetricsElement).totalRenderTime)
            .map(([componentKey, metrics]) => (
              <div
                key={componentKey}
                style={{
                  padding: "4px 6px",
                  backgroundColor: "rgba(0, 122, 204, 0.05)",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                  lineHeight: "1.3",
                }}
              >
                <div style={{ fontWeight: "bold", color: "#007acc", fontSize: "0.75rem" }}>
                  {componentKey}
                </div>
                <div style={{ fontSize: "0.65rem", color: "#666" }}>
                  #{(metrics as RenderPerformanceMetricsElement).renderCount} renders | Last: {(metrics as RenderPerformanceMetricsElement).lastRenderTime.toFixed(2)}ms |
                  Total: {(metrics as RenderPerformanceMetricsElement).totalRenderTime.toFixed(2)}ms | Avg:{" "}
                  {(metrics as RenderPerformanceMetricsElement).averageRenderTime.toFixed(2)}ms | Min/Max:{" "}
                  {(metrics as RenderPerformanceMetricsElement).minRenderTime.toFixed(2)}ms/{(metrics as RenderPerformanceMetricsElement).maxRenderTime.toFixed(2)}ms
                </div>
              </div>
            ))}
        </div>
      </>
    );
  };
}


