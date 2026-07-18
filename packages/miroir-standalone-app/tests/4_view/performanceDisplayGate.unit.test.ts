import { beforeEach, describe, expect, it } from "vitest";
import {
  getPerformanceConfig,
  resetPerformanceConfig,
  updatePerformanceConfig,
} from "../../src/miroir-fwk/4_view/tools/performanceConfig.js";
import { applyPerformanceDisplayGate } from "../../src/miroir-fwk/4_view/tools/performanceDisplayGate.js";
import { renderInsightRegistry } from "../../src/miroir-fwk/4_view/tools/renderInsightRegistry.js";
import { RenderPerformanceMetrics } from "../../src/miroir-fwk/4_view/tools/renderPerformanceMeasure.js";

describe("applyPerformanceDisplayGate (Phase 1.4)", () => {
  beforeEach(() => {
    resetPerformanceConfig();
    renderInsightRegistry.resetAll();
    RenderPerformanceMetrics.resetMetrics();
    // Seed some metrics so clear-on-disable is observable
    updatePerformanceConfig({ enabled: true }, false);
    RenderPerformanceMetrics.trackRenderPerformance("SeedComponent", 5);
    renderInsightRegistry.trackRender({
      componentId: "SeedComponent",
      navigationKey: "nav",
      enabled: true,
    });
  });

  it("sets performanceConfig.enabled to match the timer gate", () => {
    applyPerformanceDisplayGate(true);
    expect(getPerformanceConfig().enabled).toBe(true);

    applyPerformanceDisplayGate(false);
    expect(getPerformanceConfig().enabled).toBe(false);
  });

  it("clears insight and timing metrics when turning the gate off", () => {
    applyPerformanceDisplayGate(true);
    expect(renderInsightRegistry.size()).toBeGreaterThan(0);

    applyPerformanceDisplayGate(false);

    expect(renderInsightRegistry.size()).toBe(0);
    expect(Object.keys(RenderPerformanceMetrics.getMetricsSnapshot())).toHaveLength(0);
  });
});
