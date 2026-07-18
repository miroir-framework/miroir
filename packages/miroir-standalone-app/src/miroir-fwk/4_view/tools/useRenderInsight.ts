/**
 * React hook for gated render-insight tracking.
 * Near-zero cost when showPerformanceDisplay is off (no registry writes).
 * When on, tracks synchronously so inline chips see live counts (progressive
 * mount already limits how many instrumented nodes render at once).
 */

import { useMiroirContextService } from "miroir-react";
import {
  NOOP_RENDER_COUNTS,
  renderInsightRegistry,
  type RenderCounts,
} from "./renderInsightRegistry.js";

/**
 * Track component renders only when performance display mode is on.
 * Optional formikPath distinguishes siblings that share a component name.
 *
 * Returns the updated counts from this render (chips must not wait for idle
 * flush — progressive reveal often leaves no follow-up re-render).
 */
export const useRenderInsight = (
  componentId: string,
  navigationKey: string,
  formikPath?: string
): RenderCounts => {
  const context = useMiroirContextService();
  if (!context.showPerformanceDisplay) {
    return NOOP_RENDER_COUNTS;
  }
  return renderInsightRegistry.trackRender({
    componentId,
    navigationKey,
    formikPath,
    enabled: true,
  });
};
