import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import type { GraphReportSection } from "miroir-core";
import { ApplicationSection } from "miroir-core";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import { defaultStoredMiroirTheme } from "miroir-test-app_deployment-miroir";

const showPerformanceDisplayRef = { current: false };

vi.mock("miroir-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-react")>();
  return {
    ...actual,
    useMiroirContextService: () => ({
      showPerformanceDisplay: showPerformanceDisplayRef.current,
      showDebugInfo: false,
    }),
  };
});

vi.mock("../../src/miroir-fwk/4_view/components/Graph/GraphComponent.js", () => ({
  GraphComponent: (props: { "data-testid"?: string }) => (
    <div data-testid={props["data-testid"] ?? "graph-stub"} />
  ),
}));

import { MiroirThemeProvider } from "../../src/miroir-fwk/4_view/contexts/MiroirThemeContext.js";
import { GraphReportSectionView } from "../../src/miroir-fwk/4_view/components/Graph/GraphReportSectionView.js";

const testThemeOptions = [
  {
    id: "default",
    name: "Default Theme",
    description: "Test theme",
    theme: defaultStoredMiroirTheme.definition,
  },
];

const barChartReportSection: GraphReportSection = {
  type: "graphReportSection",
  definition: {
    label: "Entities Bar Chart",
    graphType: "bar",
    fetchedDataReference: "entities",
    dataMapping: {
      x: "name",
      y: "value",
      color: "category",
    },
    config: {
      showLegend: true,
      showTooltips: true,
    },
  },
};

describe("GraphReportSectionView RenderInsightHeader (Phase 4)", () => {
  beforeEach(() => {
    showPerformanceDisplayRef.current = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows RenderInsightHeader when performance mode is on", () => {
    showPerformanceDisplayRef.current = true;
    render(
      <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
        <GraphReportSectionView
          applicationSection={"data" as ApplicationSection}
          deploymentUuid={deployment_Miroir.uuid}
          queryResults={{
            entities: [{ uuid: "1", name: "A", value: 10, category: "T" }],
          }}
          reportSection={barChartReportSection}
        />
      </MiroirThemeProvider>
    );

    expect(screen.getByTestId("render-insight-header")).toBeInTheDocument();
    expect(screen.getByTestId("render-insight-header")).toHaveTextContent(
      "GraphReportSectionView"
    );
    expect(screen.queryByText(/GraphReportSectionView renders:/)).not.toBeInTheDocument();
  });

  it("hides RenderInsightHeader when performance mode is off", () => {
    showPerformanceDisplayRef.current = false;
    render(
      <MiroirThemeProvider currentThemeOptions={testThemeOptions}>
        <GraphReportSectionView
          applicationSection={"data" as ApplicationSection}
          deploymentUuid={deployment_Miroir.uuid}
          queryResults={{
            entities: [{ uuid: "1", name: "A", value: 10, category: "T" }],
          }}
          reportSection={barChartReportSection}
        />
      </MiroirThemeProvider>
    );

    expect(screen.queryByTestId("render-insight-header")).not.toBeInTheDocument();
  });
});
