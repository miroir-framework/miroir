import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_RENDER_INSIGHT_MAX_DEPTH,
  RENDER_INSIGHT_MAX_DEPTH_STORAGE_KEY,
  getRenderInsightMaxDepth,
  setRenderInsightMaxDepth,
} from "../../src/miroir-fwk/4_view/tools/renderInsightMaxDepth.js";

describe("renderInsightMaxDepth (Phase 2.4)", () => {
  beforeEach(() => {
    sessionStorage.removeItem(RENDER_INSIGHT_MAX_DEPTH_STORAGE_KEY);
  });

  afterEach(() => {
    sessionStorage.removeItem(RENDER_INSIGHT_MAX_DEPTH_STORAGE_KEY);
  });

  it("defaults to 2 when nothing is stored", () => {
    expect(getRenderInsightMaxDepth()).toBe(DEFAULT_RENDER_INSIGHT_MAX_DEPTH);
    expect(DEFAULT_RENDER_INSIGHT_MAX_DEPTH).toBe(2);
  });

  it("persists a live on-page change in sessionStorage", () => {
    setRenderInsightMaxDepth(5);
    expect(getRenderInsightMaxDepth()).toBe(5);
    expect(sessionStorage.getItem(RENDER_INSIGHT_MAX_DEPTH_STORAGE_KEY)).toBe("5");
  });

  it("clamps negative or non-finite values to 0", () => {
    setRenderInsightMaxDepth(-3);
    expect(getRenderInsightMaxDepth()).toBe(0);
    setRenderInsightMaxDepth(Number.NaN);
    expect(getRenderInsightMaxDepth()).toBe(0);
  });
});
