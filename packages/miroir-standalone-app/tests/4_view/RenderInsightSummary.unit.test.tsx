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
      borderRadius: { sm: "4px" },
      spacing: { xs: "4px", sm: "8px" },
      typography: { fontSize: { xs: "11px", sm: "13px" } },
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
    expect(screen.getByTestId("render-insight-summary")).toHaveTextContent("ReportPage");

    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(
      screen.getByText(/Interact with the report — instrumented components will appear here/i)
    ).toBeInTheDocument();
    expect(renderInsightRegistry.size()).toBe(0);
  });
});
