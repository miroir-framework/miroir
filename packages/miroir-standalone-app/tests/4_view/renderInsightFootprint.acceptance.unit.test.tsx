/**
 * Phase 7.1 — Footprint acceptance (#61 negligible-impact gate).
 *
 * With the timer off, instrumented components must not write the registry,
 * must not call performance.now for insights, and must not mount insight UI.
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const showPerformanceDisplayRef = { current: false };

vi.mock("miroir-react", () => ({
  useMiroirContextService: () => ({
    showPerformanceDisplay: showPerformanceDisplayRef.current,
  }),
}));

vi.mock("../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js", () => ({
  useMiroirTheme: () => ({
    currentTheme: {
      colors: {},
      components: {
        renderInsight: {
          background: "#134e4a",
          textColor: "#f0fdfa",
          textMuted: "#99f6e4",
          accent: "#0f766e",
          borderColor: "#0f766e",
          badgeBackground: "#99f6e4",
          badgeTextColor: "#042f2e",
          fontSize: "12px",
          fontSizeSummary: "13px",
          borderRadius: "999px",
          borderRadiusSummary: "6px",
        },
      },
    },
  }),
}));

import { RenderInsightHeader } from "../../src/miroir-fwk/4_view/components/RenderInsightHeader.js";
import { RenderInsightSummary } from "../../src/miroir-fwk/4_view/components/RenderInsightSummary.js";
import {
  NOOP_RENDER_COUNTS,
  renderInsightRegistry,
} from "../../src/miroir-fwk/4_view/tools/renderInsightRegistry.js";
import { useRenderInsight } from "../../src/miroir-fwk/4_view/tools/useRenderInsight.js";

const Fixture: React.FC<{ label: string }> = ({ label }) => {
  const { navigationCount, totalCount } = useRenderInsight("FootprintFixture", label);
  return (
    <div data-testid="fixture">
      <RenderInsightHeader
        componentName="FootprintFixture"
        navigationCount={navigationCount}
        totalCount={totalCount}
        formikPath={label}
      />
      <span>{label}</span>
    </div>
  );
};

describe("Phase 7.1 footprint acceptance (timer off)", () => {
  beforeEach(() => {
    showPerformanceDisplayRef.current = false;
    renderInsightRegistry.resetAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps registry empty and mounts no insight UI after many renders when timer is off", () => {
    const trackSpy = vi.spyOn(renderInsightRegistry, "trackRender");

    const { rerender, container } = render(
      <>
        <Fixture label="a" />
        <RenderInsightSummary />
      </>
    );

    for (let i = 0; i < 25; i++) {
      rerender(
        <>
          <Fixture label={`pass-${i}`} />
          <RenderInsightSummary />
        </>
      );
    }

    expect(renderInsightRegistry.size()).toBe(0);
    expect(trackSpy).not.toHaveBeenCalled();
    expect(screen.queryByTestId("render-insight-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("render-insight-summary")).not.toBeInTheDocument();
    expect(container.querySelector("[data-miroir-overlay='render-insight']")).toBeNull();
  });

  it("useRenderInsight returns NOOP counts when timer is off", () => {
    showPerformanceDisplayRef.current = false;
    const { rerender } = render(<Fixture label="noop" />);
    for (let i = 0; i < 10; i++) {
      rerender(<Fixture label={`noop-${i}`} />);
    }
    expect(renderInsightRegistry.size()).toBe(0);
    // Header absent implies hook returned noop (no counts to display).
    expect(screen.queryByTestId("render-insight-header")).not.toBeInTheDocument();
    expect(NOOP_RENDER_COUNTS).toEqual({ navigationCount: 0, totalCount: 0 });
  });

  it("when timer is on, registry grows and insight chrome appears", () => {
    showPerformanceDisplayRef.current = true;

    render(
      <>
        <Fixture label="on" />
        <RenderInsightSummary />
      </>
    );

    expect(renderInsightRegistry.size()).toBeGreaterThan(0);
    expect(screen.getByTestId("render-insight-header")).toBeInTheDocument();
    expect(screen.getByTestId("render-insight-summary")).toBeInTheDocument();
  });
});
