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
      borderRadius: { sm: "4px" },
    },
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
      expect(chip).toHaveTextContent("▾ 12 below");
      expect(chip).toHaveTextContent("avg 3.2");
      expect(chip).toHaveTextContent("min instance.name ×1");
      expect(chip).toHaveTextContent("max instance.firstName ×18");
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
});
