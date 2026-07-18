/**
 * Syncs the AppBar performance timer with performanceConfig and clears
 * collected metrics when the gate turns off.
 */

import { updatePerformanceConfig } from "./performanceConfig.js";
import { renderInsightRegistry } from "./renderInsightRegistry.js";
import { RenderPerformanceMetrics } from "./renderPerformanceMeasure.js";

/**
 * Apply the global performance-display gate.
 * When turning off, clears insight registry and timing metrics.
 */
export function applyPerformanceDisplayGate(enabled: boolean): void {
  updatePerformanceConfig({ enabled }, true);
  if (!enabled) {
    renderInsightRegistry.resetAll();
    RenderPerformanceMetrics.resetMetrics();
  }
}
