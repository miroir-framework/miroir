import { useEffect, useState } from 'react';
import { RenderPerformanceMetrics } from '../tools/renderPerformanceMeasure.js';

// Separate component to manage performance display state independently
export const PerformanceDisplayContainer = () => {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const updateCallback = () => {
      // Only update if we actually have metrics to display
      if (Object.keys(RenderPerformanceMetrics.renderMetrics).length > 0) {
        // console.log('PerformanceDisplayContainer: Performance metrics updated, triggering re-render');
        setUpdateTrigger(prev => prev + 1);
      }
    };
    
    RenderPerformanceMetrics.addChangeCallback(updateCallback);
    
    return () => {
      RenderPerformanceMetrics.removeChangeCallback(updateCallback);
    };
  }, []);

  // Only render if we have metrics to display and there are performance issues
  const hasSignificantPerformanceIssues = Object.values(RenderPerformanceMetrics.renderMetrics).some(
    metrics => metrics.averageRenderTime > 10 || metrics.maxRenderTime > 50
  );

  if (Object.keys(RenderPerformanceMetrics.renderMetrics).length === 0 || !hasSignificantPerformanceIssues) {
    return null;
  }

  return (
    <RenderPerformanceMetrics.GlobalRenderPerformanceDisplay
      key={updateTrigger}
      renderMetrics={RenderPerformanceMetrics.renderMetrics}
    />
  );
};
