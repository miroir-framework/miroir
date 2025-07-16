import { useEffect, useState } from 'react';
import { RenderPerformanceMetrics } from '../tools/renderPerformanceMeasure.js';

// Separate component to manage performance display state independently
export const PerformanceDisplayContainer = () => {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const updateCallback = () => {
      // console.log('PerformanceDisplayContainer: Performance metrics updated, triggering re-render');
      setUpdateTrigger(prev => prev + 1);
    };
    
    RenderPerformanceMetrics.addChangeCallback(updateCallback);
    
    return () => {
      RenderPerformanceMetrics.removeChangeCallback(updateCallback);
    };
  }, []);

  return (
    <RenderPerformanceMetrics.GlobalRenderPerformanceDisplay
      key={updateTrigger}
      renderMetrics={RenderPerformanceMetrics.renderMetrics}
    />
  );
};
