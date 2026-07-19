import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const showPerformanceDisplayRef = { current: false };
const showDebugInfoRef = { current: false };

vi.mock("miroir-react", () => ({
  useMiroirContextService: () => ({
    showPerformanceDisplay: showPerformanceDisplayRef.current,
    showDebugInfo: showDebugInfoRef.current,
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
    },
  }),
}));

vi.mock("../../src/miroir-fwk/4_view/tools/performanceConfig.js", () => ({
  getPerformanceConfig: () => ({
    enabled: true,
    renderThresholdMs: 1.0,
    persistMetricsAcrossNavigation: true,
  }),
}));

import { RenderInsightHeader } from "../../src/miroir-fwk/4_view/components/RenderInsightHeader.js";

describe("RenderInsightHeader (Phase 3)", () => {
  beforeEach(() => {
    showPerformanceDisplayRef.current = false;
    showDebugInfoRef.current = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("3.1 visibility and counts", () => {
    it("renders nothing when showPerformanceDisplay is false", () => {
      const { container } = render(
        <RenderInsightHeader
          componentName="ReportSectionEntityInstance"
          navigationCount={4}
          totalCount={20}
        />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("shows compact render counts when performance mode is on", () => {
      showPerformanceDisplayRef.current = true;
      render(
        <RenderInsightHeader
          componentName="ReportSectionEntityInstance"
          navigationCount={4}
          totalCount={20}
        />
      );

      const header = screen.getByTestId("render-insight-header");
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent("ReportSectionEntityInstance");
      expect(header).toHaveTextContent("×4");
      expect(header).toHaveTextContent("Σ20");
    });

    it("shows last render ms when at or above the display threshold", () => {
      showPerformanceDisplayRef.current = true;
      render(
        <RenderInsightHeader
          componentName="ValueObjectGrid"
          navigationCount={1}
          totalCount={1}
          lastRenderTime={5.5}
        />
      );
      expect(screen.getByTestId("render-insight-header")).toHaveTextContent("5.5ms");
    });
  });

  describe("3.2 aggregate chip", () => {
    it("shows subtree aggregate when provided", () => {
      showPerformanceDisplayRef.current = true;
      render(
        <RenderInsightHeader
          componentName="ReportSectionEntityInstance"
          navigationCount={3}
          totalCount={10}
          aggregate={{
            descendantCount: 12,
            sumNavigationRenders: 38.4,
            avgNavigationRenders: 3.2,
            min: { path: "JzodElementEditor@instance.name", navigationCount: 1 },
            max: {
              path: "JzodElementEditor@instance.firstName",
              navigationCount: 18,
            },
          }}
        />
      );

      const chip = screen.getByTestId("render-insight-aggregate");
      expect(chip).toHaveTextContent("▾12");
      expect(chip).toHaveTextContent("avg3.2");
      expect(chip).toHaveTextContent("min×1");
      expect(chip).toHaveTextContent("max×18");
    });
  });

  describe("3.3 sibling to JsonDisplayHelper (independent of bug toggle)", () => {
    it("still renders when showDebugInfo is off and timer is on", () => {
      showPerformanceDisplayRef.current = true;
      showDebugInfoRef.current = false;
      render(
        <RenderInsightHeader
          componentName="ReportPage"
          navigationCount={2}
          totalCount={5}
        />
      );
      expect(screen.getByTestId("render-insight-header")).toBeInTheDocument();
    });
  });

  describe("distinct chrome vs visual-debug", () => {
    it("marks overlay as render-insight with compact fit-content chip (not full-width bar)", () => {
      showPerformanceDisplayRef.current = true;
      render(
        <RenderInsightHeader
          componentName="ReportPage"
          navigationCount={1}
          totalCount={1}
          formikPath="instance.query.definition.name"
        />
      );

      const header = screen.getByTestId("render-insight-header");
      expect(header).toHaveAttribute("data-miroir-overlay", "render-insight");
      expect(screen.getByTestId("render-insight-badge")).toHaveTextContent("perf");
      expect(header).toHaveTextContent("…definition.name");
      expect(header).toHaveAttribute(
        "title",
        "ReportPage @ instance.query.definition.name"
      );
      expect(header.style.display).toBe("inline-flex");
      expect(header.style.width).toBe("fit-content");
      expect(header.style.borderRadius).toBe("999px");
      expect(header.style.backgroundColor).toBe("#134e4a");
      expect(header.style.fontSize).toBe("12px");
      expect(header.style.backgroundColor).not.toBe("#fffbeb");
    });
  });
});
