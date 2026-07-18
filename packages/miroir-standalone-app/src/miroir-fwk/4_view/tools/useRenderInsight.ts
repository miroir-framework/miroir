/**
 * React hook for gated render-insight tracking.
 * Near-zero cost when showPerformanceDisplay is off (no registry writes).
 */

import { useMiroirContextService } from "miroir-react";
import {
  NOOP_RENDER_COUNTS,
  renderInsightRegistry,
  type RenderCounts,
} from "./renderInsightRegistry.js";

/**
 * Track component renders only when performance display mode is on.
 */
export const useRenderInsight = (
  componentId: string,
  navigationKey: string
): RenderCounts => {
  const context = useMiroirContextService();
  if (!context.showPerformanceDisplay) {
    return NOOP_RENDER_COUNTS;
  }
  return renderInsightRegistry.trackRender({
    componentId,
    navigationKey,
    enabled: true,
  });
};
