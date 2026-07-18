import { describe, expect, it } from "vitest";
import {
  PROGRESSIVE_RENDER_ABOVE_VIEWPORTS,
  PROGRESSIVE_RENDER_BELOW_VIEWPORTS,
  PROGRESSIVE_RENDER_ROOT_MARGIN,
  buildProgressiveRenderRootMargin,
} from "../../src/miroir-fwk/4_view/tools/progressiveRenderConfig.js";

describe("progressiveRenderConfig (viewport-gated)", () => {
  it("builds a rootMargin that prefetches several viewport heights below", () => {
    expect(PROGRESSIVE_RENDER_BELOW_VIEWPORTS).toBeGreaterThanOrEqual(2);
    expect(PROGRESSIVE_RENDER_ROOT_MARGIN).toBe(buildProgressiveRenderRootMargin());
    // top right bottom left — bottom uses % of viewport (= look-ahead)
    expect(PROGRESSIVE_RENDER_ROOT_MARGIN).toBe(
      `${PROGRESSIVE_RENDER_ABOVE_VIEWPORTS * 100}% 0px ${PROGRESSIVE_RENDER_BELOW_VIEWPORTS * 100}% 0px`
    );
  });

  it("allows custom below/above viewport counts", () => {
    expect(buildProgressiveRenderRootMargin(2, 0)).toBe("0% 0px 200% 0px");
    expect(buildProgressiveRenderRootMargin(3, 0.5)).toBe("50% 0px 300% 0px");
  });
});
