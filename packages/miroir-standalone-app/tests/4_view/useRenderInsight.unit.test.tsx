import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const showPerformanceDisplayRef = { current: false };

vi.mock("miroir-react", () => ({
  useMiroirContextService: () => ({
    showPerformanceDisplay: showPerformanceDisplayRef.current,
  }),
}));

import {
  NOOP_RENDER_COUNTS,
  renderInsightRegistry,
} from "../../src/miroir-fwk/4_view/tools/renderInsightRegistry.js";
import { useRenderInsight } from "../../src/miroir-fwk/4_view/tools/useRenderInsight.js";

describe("useRenderInsight (Phase 1.2)", () => {
  beforeEach(() => {
    showPerformanceDisplayRef.current = false;
    renderInsightRegistry.resetAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not call the registry when showPerformanceDisplay is false", () => {
    const trackSpy = vi.spyOn(renderInsightRegistry, "trackRender");
    const scheduleSpy = vi.spyOn(renderInsightRegistry, "scheduleTrackRender");

    const { result } = renderHook(() =>
      useRenderInsight("ReportPage", "dep-data")
    );

    expect(result.current).toEqual(NOOP_RENDER_COUNTS);
    expect(trackSpy).not.toHaveBeenCalled();
    expect(scheduleSpy).not.toHaveBeenCalled();
    expect(renderInsightRegistry.size()).toBe(0);
  });

  it("tracks synchronously when showPerformanceDisplay is true so chips see live counts", () => {
    showPerformanceDisplayRef.current = true;
    const trackSpy = vi.spyOn(renderInsightRegistry, "trackRender");
    const scheduleSpy = vi.spyOn(renderInsightRegistry, "scheduleTrackRender");

    const { result } = renderHook(() => useRenderInsight("ReportPage", "dep-data"));

    expect(scheduleSpy).not.toHaveBeenCalled();
    expect(trackSpy).toHaveBeenCalled();
    expect(renderInsightRegistry.size()).toBe(1);
    expect(result.current.navigationCount).toBe(1);
    expect(result.current.totalCount).toBe(1);
  });
});
