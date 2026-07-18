import { describe, it, expect, beforeEach } from "vitest";
import {
  RenderInsightRegistry,
  NOOP_RENDER_COUNTS,
} from "../../src/miroir-fwk/4_view/tools/renderInsightRegistry.js";

describe("RenderInsightRegistry (Phase 1–2)", () => {
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

  describe("2.1 path identity via formik path", () => {
    it("distinguishes siblings that share a component name using formikPath", () => {
      registry.trackRender({
        componentId: "JzodElementEditor",
        formikPath: "instance.name",
        navigationKey: "dep-data",
        enabled: true,
      });
      registry.trackRender({
        componentId: "JzodElementEditor",
        formikPath: "instance.firstName",
        navigationKey: "dep-data",
        enabled: true,
      });
      registry.trackRender({
        componentId: "JzodElementEditor",
        formikPath: "instance.name",
        navigationKey: "dep-data",
        enabled: true,
      });

      const snapshot = registry.getSnapshot();
      expect(snapshot).toHaveLength(2);

      const byPath = Object.fromEntries(snapshot.map((n) => [n.pathKey, n]));
      expect(byPath["JzodElementEditor@instance.name"].navigationCount).toBe(2);
      expect(byPath["JzodElementEditor@instance.firstName"].navigationCount).toBe(1);
      expect(byPath["JzodElementEditor@instance.name"].depth).toBe(2);
      expect(byPath["JzodElementEditor@instance.firstName"].formikPath).toBe(
        "instance.firstName"
      );
    });

    it("uses componentId alone when formikPath is absent", () => {
      registry.trackRender({
        componentId: "ReportPage",
        navigationKey: "dep-data",
        enabled: true,
      });

      const snapshot = registry.getSnapshot();
      expect(snapshot).toHaveLength(1);
      expect(snapshot[0].pathKey).toBe("ReportPage");
      expect(snapshot[0].depth).toBe(0);
      expect(snapshot[0].formikPath).toBeUndefined();
    });
  });
});
