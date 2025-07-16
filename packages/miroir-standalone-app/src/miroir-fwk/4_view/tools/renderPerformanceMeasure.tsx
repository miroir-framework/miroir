// Performance tracking for JzodElementEditor renders
export interface RenderPerformanceMetrics {
  renderCount: number;
  totalRenderTime: number;
  lastRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  averageRenderTime: number;
}

export const renderMetrics: Record<string, RenderPerformanceMetrics> = {};

// Function to track render performance
export function trackRenderPerformance(componentKey: string, renderTime: number): RenderPerformanceMetrics {
  if (!renderMetrics[componentKey]) {
    renderMetrics[componentKey] = {
      renderCount: 0,
      totalRenderTime: 0,
      lastRenderTime: 0,
      maxRenderTime: 0,
      minRenderTime: Infinity,
      averageRenderTime: 0
    };
  }
  
  const metrics = renderMetrics[componentKey];
  metrics.renderCount++;
  metrics.totalRenderTime += renderTime;
  metrics.lastRenderTime = renderTime;
  metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime);
  metrics.minRenderTime = Math.min(metrics.minRenderTime, renderTime);
  metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
  
  return metrics;
}

// Component to display render performance metrics
export const RenderPerformanceDisplay = ({ componentKey, indentLevel }: { componentKey: string; indentLevel?: number }) => {
  const metrics = renderMetrics[componentKey];
  
  if (!metrics) return null;
  
  return (
    <div style={{
      fontSize: '0.7rem',
      color: '#666',
      backgroundColor: 'rgba(255, 255, 0, 0.1)',
      padding: '2px 4px',
      margin: '1px 0',
      border: '1px solid #ddd',
      borderRadius: '3px',
      fontFamily: 'monospace',
      marginLeft: `${(indentLevel || 0) * 10}px`
    }}>
      <strong>{componentKey}:</strong> #{metrics.renderCount} | 
      Last: {metrics.lastRenderTime.toFixed(2)}ms | 
      Total: {metrics.totalRenderTime.toFixed(2)}ms | 
      Avg: {metrics.averageRenderTime.toFixed(2)}ms | 
      Min/Max: {metrics.minRenderTime.toFixed(2)}ms/{metrics.maxRenderTime.toFixed(2)}ms
    </div>
  );
};

// Global performance summary display
export const GlobalRenderPerformanceDisplay = () => {
  const totalRenders = Object.values(renderMetrics).reduce(
    (sum, metrics) => sum + metrics.renderCount,
    0
  );
  const totalTime = Object.values(renderMetrics).reduce(
    (sum, metrics) => sum + metrics.totalRenderTime,
    0
  );
  const averageTime = totalRenders > 0 ? totalTime / totalRenders : 0;

  if (totalRenders === 0) return null;

  return (
    <div
      style={{
        fontSize: "0.7rem",
        color: "#333",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: "8px",
        border: "2px solid #007acc",
        borderRadius: "4px",
        fontFamily: "monospace",
        position: "fixed",
        top: "10px",
        left: "10px",
        zIndex: 9999,
        maxWidth: "500px",
        maxHeight: "80vh",
        overflow: "auto",
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          borderBottom: "1px solid #ddd",
          marginBottom: "8px",
          padding: "4px 0",
        }}
      >
        JzodElementEditor Performance Stats
      </div>
      <div style={{ marginBottom: "8px", padding: "4px 0", borderBottom: "1px solid #eee" }}>
        <div>
          Total Renders: {totalRenders} | Total Time: {totalTime.toFixed(2)}ms | Avg:{" "}
          {averageTime.toFixed(2)}ms
        </div>
        <div>Active Components: {Object.keys(renderMetrics).length}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {Object.entries(renderMetrics)
          .sort(([, a], [, b]) => b.totalRenderTime - a.totalRenderTime)
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
                #{metrics.renderCount} renders | Last: {metrics.lastRenderTime.toFixed(2)}ms |
                Total: {metrics.totalRenderTime.toFixed(2)}ms | Avg:{" "}
                {metrics.averageRenderTime.toFixed(2)}ms | Min/Max:{" "}
                {metrics.minRenderTime.toFixed(2)}ms/{metrics.maxRenderTime.toFixed(2)}ms
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
