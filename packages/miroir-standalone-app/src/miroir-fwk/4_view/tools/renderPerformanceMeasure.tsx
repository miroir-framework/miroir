/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import * as React from 'react';
import { DraggableContainer } from '../components/DraggableContainer.js';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';

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
    const { currentTheme } = useMiroirTheme();
    const metrics = this.renderMetrics[componentKey];

    if (!metrics) return null;

    const displayStyles = css({
      fontSize: currentTheme.typography.fontSize.xs,
      color: currentTheme.colors.textSecondary,
      backgroundColor: currentTheme.colors.successSurface,
      padding: currentTheme.spacing.xs,
      margin: '1px 0',
      border: `1px solid ${currentTheme.colors.borderLight}`,
      borderRadius: currentTheme.borderRadius.sm,
      fontFamily: 'monospace',
      marginLeft: `${(indentLevel || 0) * 10}px`,
    });

    return (
      <div css={displayStyles}>
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
  static RenderMetricsContent: React.FC = () => {
    const { currentTheme } = useMiroirTheme();
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

    if (totalRenders === 0) return <div key="no-stats">No stats yet!</div>;

    // Create a unique key based on current metrics to ensure React re-renders parent naturally
    const metricsKey = `metrics-${totalRenders}-${totalTime.toFixed(2)}`;

    const summaryStyles = css({
      marginBottom: currentTheme.spacing.sm,
      padding: `${currentTheme.spacing.xs} 0`,
      borderBottom: `1px solid ${currentTheme.colors.divider}`,
      color: currentTheme.colors.text,
      fontSize: currentTheme.typography.fontSize.sm,
    });

    const metricsListStyles = css({
      display: 'flex',
      flexDirection: 'column',
      gap: currentTheme.spacing.xs,
    });

    const metricItemStyles = css({
      padding: currentTheme.spacing.xs,
      backgroundColor: currentTheme.colors.surface,
      border: `1px solid ${currentTheme.colors.borderLight}`,
      borderRadius: currentTheme.borderRadius.sm,
      lineHeight: currentTheme.typography.lineHeight.normal,
    });

    const componentNameStyles = css({
      fontWeight: currentTheme.typography.fontWeight.bold,
      color: currentTheme.colors.primary,
      fontSize: currentTheme.typography.fontSize.sm,
    });

    const metricsDetailStyles = css({
      fontSize: currentTheme.typography.fontSize.xs,
      color: currentTheme.colors.textSecondary,
      fontFamily: 'monospace',
    });

    return (
      <div key={metricsKey}>
        <div css={summaryStyles}>
          <div>
            Total Renders: {totalRenders} | Total Time: {totalTime.toFixed(2)}ms | Avg:{" "}
            {averageTime.toFixed(2)}ms
          </div>
          <div>Active Components: {Object.keys(renderMetrics).length}</div>
        </div>
        <div css={metricsListStyles}>
          {Object.entries(renderMetrics)
            .sort(([, a], [, b]) => (b as RenderPerformanceMetricsElement).totalRenderTime - (a as RenderPerformanceMetricsElement).totalRenderTime)
            .map(([componentKey, metrics]) => (
              <div key={componentKey} css={metricItemStyles}>
                <div css={componentNameStyles}>
                  {componentKey}
                </div>
                <div css={metricsDetailStyles}>
                  #{(metrics as RenderPerformanceMetricsElement).renderCount} renders | Last: {(metrics as RenderPerformanceMetricsElement).lastRenderTime.toFixed(2)}ms |
                  Total: {(metrics as RenderPerformanceMetricsElement).totalRenderTime.toFixed(2)}ms | Avg:{" "}
                  {(metrics as RenderPerformanceMetricsElement).averageRenderTime.toFixed(2)}ms | Min/Max:{" "}
                  {(metrics as RenderPerformanceMetricsElement).minRenderTime.toFixed(2)}ms/{(metrics as RenderPerformanceMetricsElement).maxRenderTime.toFixed(2)}ms
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };
}

// ################################################################################################
// Themed Performance Components
// ################################################################################################

// Themed draggable performance display container
export const ThemedPerformanceDisplay: React.FC<{
  title?: string;
  storageKey?: string;
  defaultPosition?: { x: number; y: number };
}> = ({ 
  title = "Performance Stats",
  storageKey = "performanceStatsPosition",
  defaultPosition = { x: 10, y: 10 }
}) => {
  return (
    <DraggableContainer 
      title={title}
      storageKey={storageKey}
      defaultPosition={defaultPosition}
    >
      <RenderPerformanceMetrics.RenderMetricsContent />
    </DraggableContainer>
  );
};

// Themed individual performance metric card
export const ThemedPerformanceMetricCard: React.FC<{
  componentKey: string;
  metrics: RenderPerformanceMetricsElement;
  indentLevel?: number;
}> = ({ componentKey, metrics, indentLevel = 0 }) => {
  const { currentTheme } = useMiroirTheme();

  const cardStyles = css({
    padding: currentTheme.spacing.sm,
    marginLeft: `${indentLevel * 12}px`,
    marginBottom: currentTheme.spacing.xs,
    backgroundColor: currentTheme.colors.surface,
    border: `1px solid ${currentTheme.colors.borderLight}`,
    borderRadius: currentTheme.borderRadius.md,
    boxShadow: currentTheme.elevation.low,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: currentTheme.colors.hover,
      boxShadow: currentTheme.elevation.medium,
    },
  });

  const titleStyles = css({
    fontWeight: currentTheme.typography.fontWeight.bold,
    color: currentTheme.colors.primary,
    fontSize: currentTheme.typography.fontSize.md,
    marginBottom: currentTheme.spacing.xs,
  });

  const metricsRowStyles = css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: currentTheme.spacing.xs,
  });

  const metricStyles = css({
    fontSize: currentTheme.typography.fontSize.xs,
    color: currentTheme.colors.textSecondary,
    fontFamily: 'monospace',
  });

  const badgeStyles = css({
    backgroundColor: currentTheme.colors.primaryLight,
    color: currentTheme.colors.background,
    padding: `2px ${currentTheme.spacing.xs}`,
    borderRadius: currentTheme.borderRadius.sm,
    fontSize: currentTheme.typography.fontSize.xs,
    fontWeight: currentTheme.typography.fontWeight.bold,
  });

  return (
    <div css={cardStyles}>
      <div css={titleStyles}>{componentKey}</div>
      <div css={metricsRowStyles}>
        <span css={badgeStyles}>#{metrics.renderCount}</span>
        <span css={metricStyles}>
          Last: {metrics.lastRenderTime.toFixed(2)}ms
        </span>
        <span css={metricStyles}>
          Avg: {metrics.averageRenderTime.toFixed(2)}ms
        </span>
        <span css={metricStyles}>
          Total: {metrics.totalRenderTime.toFixed(2)}ms
        </span>
        <span css={metricStyles}>
          Range: {metrics.minRenderTime.toFixed(2)}-{metrics.maxRenderTime.toFixed(2)}ms
        </span>
      </div>
    </div>
  );
};


