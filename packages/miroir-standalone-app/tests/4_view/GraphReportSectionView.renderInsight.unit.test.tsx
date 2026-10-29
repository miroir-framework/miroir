import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen } from "@testing-library/react";
import { MiroirContextReactTestProvider } from "miroir-react";
import "@testing-library/jest-dom";

import type { GraphReportSection } from "miroir-core";
import { ApplicationSection } from "miroir-core";
import { deployment_Miroir } from "miroir-app-admin";
import { defaultStoredMiroirTheme } from "miroir-app-miroir";

const showPerformanceDisplayRef = { current: false };

vi.mock("../../src/miroir-fwk/4_view/components/Graph/GraphComponent.js", () => ({
  GraphComponent: (props: { "data-testid"?: string }) => (
    <div data-testid={props["data-testid"] ?? "graph-stub"} />
  ),
}));

import { MiroirThemeProvider } from "miroir-react";
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

const TestContext = ({ children }: { children: React.ReactNode }) => (
  <MiroirContextReactTestProvider
    value={
      {
        showPerformanceDisplay: showPerformanceDisplayRef.current,
        showDebugInfo: false,
      } as any
    }
  >
    {children}
  </MiroirContextReactTestProvider>
);
const render = ((ui: React.ReactElement, options?: Parameters<typeof rtlRender>[1]) =>
  rtlRender(ui, { wrapper: TestContext, ...options })) as typeof rtlRender;

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
