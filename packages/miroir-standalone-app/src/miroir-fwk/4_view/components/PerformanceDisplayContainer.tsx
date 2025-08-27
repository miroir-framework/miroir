import { useMiroirContextService } from '../MiroirContextReactProvider.js';
import { RenderPerformanceMetrics } from '../tools/renderPerformanceMeasure.js';
import { DraggableContainer } from './DraggableContainer.js';

// Separate component to manage performance display state independently
export const PerformanceDisplayContainer = () => {
  const context = useMiroirContextService();

  // Only render if performance display is enabled and we have metrics
  if (!context.showPerformanceDisplay || Object.keys(RenderPerformanceMetrics.renderMetrics).length === 0) {
    return null;
  }

  return (
    <DraggableContainer
      title="ReportPage Performance Stats"
    >
      <RenderPerformanceMetrics.RenderMetricsContent />
    </DraggableContainer>
  );
};
