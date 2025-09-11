import React, { useState, useEffect, useCallback } from 'react';
import { useMiroirContextService } from '../MiroirContextReactProvider.js';
import { RenderPerformanceMetrics, RenderPerformanceMetricsElement } from '../tools/renderPerformanceMeasure.js';
import { getPerformanceConfig, updatePerformanceConfig } from '../tools/performanceConfig.js';
import { DraggableContainer } from './DraggableContainer.js';

// Performance display container with polling-based updates
export const PerformanceDisplayContainer = () => {
  const context = useMiroirContextService();
  const [metrics, setMetrics] = useState<Record<string, RenderPerformanceMetricsElement>>({});
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds default
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Poll metrics when performance display is enabled
  useEffect(() => {
    if (!context.showPerformanceDisplay) {
      return; // No timer when disabled
    }
    
    const pollMetrics = () => {
      const snapshot = RenderPerformanceMetrics.getMetricsSnapshot();
      setMetrics(snapshot);
      setLastUpdateTime(new Date());
    };
    
    // Initial poll
    pollMetrics();
    
    // Set up polling interval
    const intervalId = setInterval(pollMetrics, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [context.showPerformanceDisplay, refreshInterval]);

  // Handlers for control buttons
  const handleClearMetrics = useCallback(() => {
    RenderPerformanceMetrics.resetMetrics();
    setMetrics({});
  }, []);

  const handleExportMetrics = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      configuration: RenderPerformanceMetrics.getConfiguration(),
      metrics: metrics
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [metrics]);

  // Only render if enabled AND we have metrics
  if (!context.showPerformanceDisplay) {
    return null;
  }

  const hasMetrics = Object.keys(metrics).length > 0;

  return (
    <DraggableContainer title="Performance Stats">
      <div style={{ padding: '8px', minWidth: '400px' }}>
        {/* Configuration Controls */}
        <div style={{ marginBottom: '12px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Refresh interval (ms):
              <input 
                type="number" 
                value={refreshInterval} 
                onChange={(e) => setRefreshInterval(Number(e.target.value))} 
                min="1000"
                step="1000"
                style={{ width: '80px' }}
              />
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Threshold (ms):
              <input 
                type="number" 
                value={getPerformanceConfig().renderThresholdMs} 
                onChange={(e) => updatePerformanceConfig({ renderThresholdMs: Number(e.target.value) })} 
                min="0"
                step="0.1"
                style={{ width: '60px' }}
              />
            </label>
            
            <button onClick={handleClearMetrics} style={{ fontSize: '0.8em' }}>
              Clear Metrics
            </button>
            
            <button onClick={handleExportMetrics} disabled={!hasMetrics} style={{ fontSize: '0.8em' }}>
              Export JSON
            </button>
          </div>
          
          {lastUpdateTime && (
            <div style={{ fontSize: '0.75em', color: '#666', marginTop: '4px' }}>
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Metrics Display */}
        {hasMetrics ? (
          <RenderPerformanceMetrics.RenderMetricsContent metrics={metrics} />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No performance data yet.<br />
            Interact with the application to see component render metrics.
          </div>
        )}
      </div>
    </DraggableContainer>
  );
};
