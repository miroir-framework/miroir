import { describe, it, expect, beforeEach } from "vitest";
import {
  RenderInsightRegistry,
  NOOP_RENDER_COUNTS,
} from "../../src/miroir-fwk/4_view/tools/renderInsightRegistry.js";

describe("RenderInsightRegistry (Phase 1)", () => {
  let registry: RenderInsightRegistry;

  beforeEach(() => {
    registry = new RenderInsightRegistry();
  });

  describe("1.1 gated trackRender", () => {
    it("does not record a render when enabled is false", () => {
      const counts = registry.trackRender({
        componentId: "ReportSectionEntityInstance",
        navigationKey: "dep-data",
        enabled: false,
      });

      expect(counts).toEqual(NOOP_RENDER_COUNTS);
      expect(registry.size()).toBe(0);
      expect(registry.getAllCounts()).toEqual({});
    });

    it("records renders when enabled is true", () => {
      const first = registry.trackRender({
        componentId: "ReportPage",
        navigationKey: "dep-data",
        enabled: true,
      });
      const second = registry.trackRender({
        componentId: "ReportPage",
        navigationKey: "dep-data",
        enabled: true,
      });

      expect(first).toEqual({ navigationCount: 1, totalCount: 1 });
      expect(second).toEqual({ navigationCount: 2, totalCount: 2 });
      expect(registry.size()).toBe(1);
    });
  });

  describe("1.3 navigation key reset", () => {
    it("resets navigationCount when navigationKey changes but keeps totalCount", () => {
      registry.trackRender({
        componentId: "RootComponent",
        navigationKey: "dep-A",
        enabled: true,
      });
      registry.trackRender({
        componentId: "RootComponent",
        navigationKey: "dep-A",
        enabled: true,
      });

      const afterNavChange = registry.trackRender({
        componentId: "RootComponent",
        navigationKey: "dep-B",
        enabled: true,
      });

      expect(afterNavChange).toEqual({ navigationCount: 1, totalCount: 3 });
    });
  });
});
