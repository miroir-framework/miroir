import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildPathKey,
  renderInsightRegistry,
} from "../../src/miroir-fwk/4_view/tools/renderInsightRegistry.js";

/**
 * Documents the object/record + array/tuple instrumentation contract used by
 * JzodObjectEditor / JzodArrayEditor (gated trackRender + durationMs + formik path).
 */
describe("Jzod editor render-insight contract", () => {
  beforeEach(() => {
    renderInsightRegistry.resetAll();
  });

  afterEach(() => {
    renderInsightRegistry.resetAll();
  });

  it("tracks object and record levels as distinct path keys with timing", () => {
    const objectCounts = renderInsightRegistry.trackRender({
      componentId: "JzodObjectEditor",
      navigationKey: "dep-app",
      formikPath: "instance.person",
      enabled: true,
      durationMs: 3.5,
    });
    const recordCounts = renderInsightRegistry.trackRender({
      componentId: "JzodRecordEditor",
      navigationKey: "dep-app",
      formikPath: "instance.tags",
      enabled: true,
      durationMs: 8.25,
    });

    expect(objectCounts.navigationCount).toBe(1);
    expect(objectCounts.lastRenderTime).toBe(3.5);
    expect(recordCounts.lastRenderTime).toBe(8.25);

    const byPath = Object.fromEntries(
      renderInsightRegistry.getSnapshot().map((n) => [n.pathKey, n])
    );
    expect(byPath[buildPathKey("JzodObjectEditor", "instance.person")].formikPath).toBe(
      "instance.person"
    );
    expect(byPath[buildPathKey("JzodRecordEditor", "instance.tags")].averageRenderTime).toBe(
      8.25
    );
  });

  it("tracks array and tuple levels as distinct path keys with timing", () => {
    renderInsightRegistry.trackRender({
      componentId: "JzodArrayEditor",
      navigationKey: "dep-app",
      formikPath: "instance.items",
      enabled: true,
      durationMs: 2,
    });
    renderInsightRegistry.trackRender({
      componentId: "JzodTupleEditor",
      navigationKey: "dep-app",
      formikPath: "instance.pair",
      enabled: true,
      durationMs: 4,
    });

    const snapshot = renderInsightRegistry.getSnapshot();
    expect(snapshot).toHaveLength(2);
    expect(
      snapshot.find((n) => n.componentId === "JzodArrayEditor")?.lastRenderTime
    ).toBe(2);
    expect(
      snapshot.find((n) => n.componentId === "JzodTupleEditor")?.lastRenderTime
    ).toBe(4);
  });

  it("does not record when performance mode is off (enabled: false)", () => {
    renderInsightRegistry.trackRender({
      componentId: "JzodObjectEditor",
      navigationKey: "dep-app",
      formikPath: "instance.person",
      enabled: false,
      durationMs: 99,
    });
    expect(renderInsightRegistry.size()).toBe(0);
  });
});
