import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook as rtlRenderHook } from "@testing-library/react";

import {
  MiroirContextReactTestProvider,
  NOOP_RENDER_COUNTS,
  renderInsightRegistry,
} from "miroir-react";

const showPerformanceDisplayRef = { current: false };

const TestContext = ({ children }: { children: React.ReactNode }) => (
  <MiroirContextReactTestProvider value={{ showPerformanceDisplay: showPerformanceDisplayRef.current }}>
    {children}
  </MiroirContextReactTestProvider>
);
const renderHook = <Result,>(hook: () => Result) => rtlRenderHook(hook, { wrapper: TestContext });
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
