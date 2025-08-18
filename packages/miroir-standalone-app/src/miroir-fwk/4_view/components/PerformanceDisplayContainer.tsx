import { useEffect, useState } from 'react';
import { RenderPerformanceMetrics } from '../tools/renderPerformanceMeasure.js';
import { useMiroirContextService } from '../MiroirContextReactProvider.js';

// Separate component to manage performance display state independently
export const PerformanceDisplayContainer = () => {
  const context = useMiroirContextService();
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

  // Only render if performance display is enabled and we have metrics
  if (!context.showPerformanceDisplay || Object.keys(RenderPerformanceMetrics.renderMetrics).length === 0) {
    return null;
  }

  return (
    <RenderPerformanceMetrics.GlobalRenderPerformanceDisplay
      key={updateTrigger}
      title="ReportPage Performance Stats"
    >
      <RenderPerformanceMetrics.RenderMetricsContent />
    </RenderPerformanceMetrics.GlobalRenderPerformanceDisplay>
  );
};
