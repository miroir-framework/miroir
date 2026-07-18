import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
      colors: {
        warning: "#f59e0b",
        warningLight: "#fffbeb",
        textSecondary: "#484746",
        text: "#111827",
        border: "#d1d5db",
        surface: "#ffffff",
        divider: "#e5e7eb",
      },
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
      borderRadius: { sm: "4px" },
      spacing: { xs: "4px", sm: "8px" },
      typography: { fontSize: { xs: "11px", sm: "12px", md: "13px" } },
    },
  }),
}));

import {
  RENDER_INSIGHT_MAX_DEPTH_STORAGE_KEY,
} from "../../src/miroir-fwk/4_view/tools/renderInsightMaxDepth.js";
import { renderInsightRegistry } from "../../src/miroir-fwk/4_view/tools/renderInsightRegistry.js";
import { RenderInsightSummary } from "../../src/miroir-fwk/4_view/components/RenderInsightSummary.js";

describe("RenderInsightSummary (Phase 5)", () => {
  beforeEach(() => {
    showPerformanceDisplayRef.current = false;
    renderInsightRegistry.resetAll();
    sessionStorage.removeItem(RENDER_INSIGHT_MAX_DEPTH_STORAGE_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when showPerformanceDisplay is false", () => {
    const { container } = render(<RenderInsightSummary />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows empty-state copy when on but no insight nodes yet", () => {
    showPerformanceDisplayRef.current = true;
    render(<RenderInsightSummary />);

    expect(screen.getByTestId("render-insight-summary")).toBeInTheDocument();
    // folded by default — expand to see empty-state copy
    fireEvent.click(screen.getByRole("button", { name: /expand render insight summary/i }));
    expect(
      screen.getByText(/Interact with the report — instrumented components will appear here/i)
    ).toBeInTheDocument();
  });

  it("lists summarized nodes and allows changing maxDepth on the page", () => {
    showPerformanceDisplayRef.current = true;
    renderInsightRegistry.trackRender({
      componentId: "RootComponent",
      navigationKey: "nav",
      enabled: true,
    });
    renderInsightRegistry.trackRender({
      componentId: "JzodElementEditor",
      formikPath: "instance.name",
      navigationKey: "nav",
      enabled: true,
    });
    renderInsightRegistry.trackRender({
      componentId: "JzodElementEditor",
      formikPath: "instance.firstName",
      navigationKey: "nav",
      enabled: true,
    });

    render(<RenderInsightSummary />);
    fireEvent.click(screen.getByRole("button", { name: /expand render insight summary/i }));

    expect(screen.getByTestId("render-insight-summary")).toHaveTextContent("RootComponent");
    // default maxDepth 2 → attribute leaves at depth 2 are visible
    expect(screen.getByLabelText(/max depth/i)).toHaveValue(2);

    fireEvent.change(screen.getByLabelText(/max depth/i), { target: { value: "0" } });
    expect(screen.getByLabelText(/max depth/i)).toHaveValue(0);
  });

  it("clears registry metrics when Clear is clicked", () => {
    showPerformanceDisplayRef.current = true;
    renderInsightRegistry.trackRender({
      componentId: "ReportPage",
      navigationKey: "nav",
      enabled: true,
    });

    render(<RenderInsightSummary />);
    fireEvent.click(screen.getByRole("button", { name: /expand render insight summary/i }));
    expect(screen.getByTestId("render-insight-summary")).toHaveTextContent("ReportPage");

    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(
      screen.getByText(/Interact with the report — instrumented components will appear here/i)
    ).toBeInTheDocument();
    expect(renderInsightRegistry.size()).toBe(0);
  });

  it("lists hotter timings first when durationMs was recorded", () => {
    showPerformanceDisplayRef.current = true;
    renderInsightRegistry.trackRender({
      componentId: "SlowGrid",
      navigationKey: "nav",
      enabled: true,
      durationMs: 40,
    });
    renderInsightRegistry.trackRender({
      componentId: "FastPage",
      navigationKey: "nav",
      enabled: true,
      durationMs: 2,
    });

    render(<RenderInsightSummary />);
    fireEvent.click(screen.getByRole("button", { name: /expand render insight summary/i }));
    const items = screen.getByTestId("render-insight-summary").querySelectorAll("li");
    expect(items[0]).toHaveTextContent("SlowGrid");
    expect(items[0]).toHaveTextContent("avg 40.0ms");
    expect(items[1]).toHaveTextContent("FastPage");
  });

  it("uses themed render-insight chrome and starts folded", () => {
    showPerformanceDisplayRef.current = true;
    render(<RenderInsightSummary />);

    const summary = screen.getByTestId("render-insight-summary");
    expect(summary).toHaveAttribute("data-miroir-overlay", "render-insight");
    expect(screen.getByTestId("render-insight-badge")).toHaveTextContent("perf");
    expect(summary.style.backgroundColor).toBe("#134e4a");
    expect(summary.style.fontSize).toBe("13px");
    expect(summary.style.backgroundColor).not.toBe("#fffbeb");
    expect(
      screen.getByRole("button", { name: /expand render insight summary/i })
    ).toBeInTheDocument();
    expect(summary.querySelectorAll("li")).toHaveLength(0);
  });
});
