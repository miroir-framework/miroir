/**
 * Centralized render count tracker for React components.
 * @deprecated Prefer useRenderInsight — this module now delegates to the gated registry.
 */

export type { RenderCounts } from "./renderInsightRegistry.js";
export {
  NOOP_RENDER_COUNTS,
  RenderInsightRegistry,
  renderInsightRegistry,
} from "./renderInsightRegistry.js";
export { useRenderInsight as useRenderTracker } from "./useRenderInsight.js";

// Keep a thin re-export of the legacy singleton API for any direct callers.
import { renderInsightRegistry } from "./renderInsightRegistry.js";

/** @deprecated Use renderInsightRegistry */
export const renderCountTracker = {
  trackRender(componentName: string, navigationKey: string) {
    return renderInsightRegistry.trackRender({
      componentId: componentName,
      navigationKey,
      enabled: true,
    });
  },
  getCounts(componentName: string) {
    return renderInsightRegistry.getCounts(componentName);
  },
  resetAll() {
    renderInsightRegistry.resetAll();
  },
  resetComponent(componentName: string) {
    renderInsightRegistry.resetComponent(componentName);
  },
  getAllCounts() {
    return renderInsightRegistry.getAllCounts();
  },
};
