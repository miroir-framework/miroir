import { act, render, screen } from "@testing-library/react";
import React from 'react';
import { beforeEach, describe, expect, it, vi } from "vitest";

import '@testing-library/jest-dom';

import type { GraphReportSection } from "miroir-core";
import {
  ApplicationSection,
  LoggerInterface,
  MiroirLoggerFactory,
} from "miroir-core";

import { packageName } from "../../src/constants";
import { GraphReportSectionView } from "../../src/miroir-fwk/4_view/components/Graph/GraphReportSectionView";
import { cleanLevel } from "../../src/miroir-fwk/4_view/constants";
import { MiroirThemeProvider } from "../../src/miroir-fwk/4_view/contexts/MiroirThemeContext";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";

// Setup logger
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "GraphReportSectionView.test")
).then((logger: LoggerInterface) => {log = logger});

// Mock d3 similar to GraphComponent tests
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      remove: vi.fn(),
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn(() => ({ attr: vi.fn() })),
            style: vi.fn(() => ({ style: vi.fn() })),
            on: vi.fn(() => ({ on: vi.fn() })),
            text: vi.fn(() => ({ text: vi.fn() })),
            html: vi.fn(() => ({ html: vi.fn() })),
            transition: vi.fn(() => ({ duration: vi.fn() })),
            selectAll: vi.fn(() => ({ style: vi.fn() })),
            call: vi.fn(() => ({ selectAll: vi.fn(() => ({ style: vi.fn() })) })),
            datum: vi.fn(() => ({ attr: vi.fn() }))
          }))
        }))
      }))
    })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({ attr: vi.fn() })),
      style: vi.fn(() => ({ style: vi.fn() })),
      text: vi.fn(() => ({ text: vi.fn() })),
      datum: vi.fn(() => ({ attr: vi.fn() })),
      selectAll: vi.fn(() => ({ 
        data: vi.fn(() => ({
          enter: vi.fn(() => ({
            append: vi.fn(() => ({
              attr: vi.fn(() => ({ attr: vi.fn() })),
              style: vi.fn(() => ({ style: vi.fn() })),
              on: vi.fn(() => ({ on: vi.fn() })),
              text: vi.fn(() => ({ text: vi.fn() }))
            }))
          }))
        }))
      })),
      call: vi.fn(() => ({ selectAll: vi.fn(() => ({ style: vi.fn() })) }))
    })),
    attr: vi.fn(() => ({ attr: vi.fn() }))
  })),
  scaleBand: vi.fn(() => ({
    domain: vi.fn(() => ({ range: vi.fn(() => ({ padding: vi.fn() })) })),
    bandwidth: vi.fn(() => 50)
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn(() => ({ range: vi.fn() }))
  })),
  scalePoint: vi.fn(() => ({
    domain: vi.fn(() => ({ range: vi.fn() }))
  })),
  scaleOrdinal: vi.fn(() => ({
    domain: vi.fn(() => ({ range: vi.fn() }))
  })),
  axisBottom: vi.fn(),
  axisLeft: vi.fn(),
  max: vi.fn(() => 100),
  extent: vi.fn(() => [0, 100]),
  line: vi.fn(() => ({
    x: vi.fn(() => ({ y: vi.fn(() => ({ curve: vi.fn() })) }))
  })),
  curveMonotoneX: {},
  pie: vi.fn(() => ({
    value: vi.fn(() => ({ sort: vi.fn() }))
  })),
  arc: vi.fn(() => ({
    innerRadius: vi.fn(() => ({ outerRadius: vi.fn() }))
  }))
}));

// Test data
const sampleEntityData = [
  { uuid: "1", name: "Entity A", value: 10, category: "Type1" },
  { uuid: "2", name: "Entity B", value: 20, category: "Type2" },
  { uuid: "3", name: "Entity C", value: 15, category: "Type1" },
  { uuid: "4", name: "Entity D", value: 25, category: "Type3" }
];

const sampleEntityDataAsIndex = {
  "1": { uuid: "1", name: "Entity A", value: 10, category: "Type1" },
  "2": { uuid: "2", name: "Entity B", value: 20, category: "Type2" },
  "3": { uuid: "3", name: "Entity C", value: 15, category: "Type1" },
  "4": { uuid: "4", name: "Entity D", value: 25, category: "Type3" }
};

const barChartReportSection: GraphReportSection = {
  type: "graphReportSection",
  definition: {
    label: "Entity Values Bar Chart",
    fetchedDataReference: "entities",
    graphType: "bar",
    dataMapping: {
      labelField: "name",
      valueField: "value",
      colorField: "category"
    },
    config: {
      width: 600,
      height: 400,
      showTooltips: true,
      showLegend: true
    }
  }
};

const lineChartReportSection: GraphReportSection = {
  type: "graphReportSection", 
  definition: {
    label: "Entity Values Trend",
    fetchedDataReference: "entities",
    graphType: "line",
    dataMapping: {
      labelField: "name",
      valueField: "value"
    },
    config: {
      width: 800,
      height: 300
    }
  }
};

const pieChartReportSection: GraphReportSection = {
  type: "graphReportSection",
  definition: {
    label: "Entity Values Distribution",
    fetchedDataReference: "entities",
    graphType: "pie",
    dataMapping: {
      labelField: "name",
      valueField: "value",
      colorField: "category"
    },
    config: {
      showLegend: true,
      showTooltips: true
    }
  }
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <MiroirThemeProvider>
      {component}
    </MiroirThemeProvider>
  );
};

describe('GraphReportSectionView Integration Tests', () => {
  beforeEach(() => {
    // Clear any existing DOM elements that d3 might have created
    document.body.innerHTML = '';
  });

  describe('Bar Chart Report Section', () => {
    it('renders bar chart with array data', async () => {
      const queryResults = {
        entities: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={barChartReportSection}
            showPerformanceDisplay={true}
          />
        );
      });

      // Check that the component renders
      const graphElement = screen.getByTestId('graph-bar-entities');
      expect(graphElement).toBeInTheDocument();

      // Check for performance display
      expect(screen.getByText(/GraphReportSectionView renders:/)).toBeInTheDocument();
    });

    it('renders bar chart with indexed data', async () => {
      const queryResults = {
        entities: sampleEntityDataAsIndex
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={barChartReportSection}
          />
        );
      });

      const graphElement = screen.getByTestId('graph-bar-entities');
      expect(graphElement).toBeInTheDocument();
    });

    it('handles missing data reference', async () => {
      const queryResults = {
        someOtherData: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={barChartReportSection}
          />
        );
      });

      // Should show no data message
      expect(screen.getByText(/No data available for graph:/)).toBeInTheDocument();
      expect(screen.getByText(/Entity Values Bar Chart/)).toBeInTheDocument();
      expect(screen.getByText(/Data reference: entities/)).toBeInTheDocument();
    });

    it('handles empty data array', async () => {
      const queryResults = {
        entities: []
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={barChartReportSection}
          />
        );
      });

      expect(screen.getByText(/No data available for graph:/)).toBeInTheDocument();
    });
  });

  describe('Line Chart Report Section', () => {
    it('renders line chart correctly', async () => {
      const queryResults = {
        entities: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={lineChartReportSection}
          />
        );
      });

      const graphElement = screen.getByTestId('graph-line-entities');
      expect(graphElement).toBeInTheDocument();
    });

    it('handles data transformation for line chart', async () => {
      const timeSeriesData = [
        { uuid: "1", date: "2024-01", sales: 100 },
        { uuid: "2", date: "2024-02", sales: 150 },
        { uuid: "3", date: "2024-03", sales: 120 }
      ];

      const lineChartWithDates: GraphReportSection = {
        type: "graphReportSection",
        definition: {
          label: "Sales Trend",
          fetchedDataReference: "salesData",
          graphType: "line",
          dataMapping: {
            labelField: "date",
            valueField: "sales"
          }
        }
      };

      const queryResults = {
        salesData: timeSeriesData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={lineChartWithDates}
          />
        );
      });

      const graphElement = screen.getByTestId('graph-line-salesData');
      expect(graphElement).toBeInTheDocument();
    });
  });

  describe('Pie Chart Report Section', () => {
    it('renders pie chart correctly', async () => {
      const queryResults = {
        entities: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={pieChartReportSection}
          />
        );
      });

      const graphElement = screen.getByTestId('graph-pie-entities');
      expect(graphElement).toBeInTheDocument();
    });

    it('handles pie chart without color field', async () => {
      const pieChartWithoutColors: GraphReportSection = {
        type: "graphReportSection",
        definition: {
          label: "Simple Pie Chart",
          fetchedDataReference: "entities",
          graphType: "pie",
          dataMapping: {
            labelField: "name",
            valueField: "value"
            // no colorField
          }
        }
      };

      const queryResults = {
        entities: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={pieChartWithoutColors}
          />
        );
      });

      const graphElement = screen.getByTestId('graph-pie-entities');
      expect(graphElement).toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('filters out invalid numeric values', async () => {
      const dataWithInvalidValues = [
        { uuid: "1", name: "Valid A", value: 10 },
        { uuid: "2", name: "Invalid B", value: "not-a-number" },
        { uuid: "3", name: "Valid C", value: 15 },
        { uuid: "4", name: "Invalid D", value: null }
      ];

      const queryResults = {
        entities: dataWithInvalidValues
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={barChartReportSection}
          />
        );
      });

      // Should still render (valid values should be processed)
      const graphElement = screen.getByTestId('graph-bar-entities');
      expect(graphElement).toBeInTheDocument();
    });

    it('handles missing field mappings gracefully', async () => {
      const dataWithMissingFields = [
        { uuid: "1", name: "Entity A" }, // missing value field
        { uuid: "2", value: 20 }, // missing name field
        { uuid: "3", name: "Entity C", value: 15 }
      ];

      const queryResults = {
        entities: dataWithMissingFields
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={barChartReportSection}
          />
        );
      });

      const graphElement = screen.getByTestId('graph-bar-entities');
      expect(graphElement).toBeInTheDocument();
    });
  });

  describe('Configuration Handling', () => {
    it('applies custom configuration correctly', async () => {
      const customConfigSection: GraphReportSection = {
        type: "graphReportSection",
        definition: {
          label: "Custom Config Chart",
          fetchedDataReference: "entities",
          graphType: "bar",
          dataMapping: {
            labelField: "name",
            valueField: "value"
          },
          config: {
            width: 1000,
            height: 500,
            showTooltips: false,
            showLegend: false,
            colors: ['#ff0000', '#00ff00', '#0000ff']
          }
        }
      };

      const queryResults = {
        entities: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={customConfigSection}
          />
        );
      });

      const graphElement = screen.getByTestId('graph-bar-entities');
      expect(graphElement).toBeInTheDocument();
    });

    it('uses default configuration when none provided', async () => {
      const sectionWithoutConfig: GraphReportSection = {
        type: "graphReportSection",
        definition: {
          label: "Default Config Chart",
          fetchedDataReference: "entities",
          graphType: "bar",
          dataMapping: {
            labelField: "name",
            valueField: "value"
          }
          // no config property
        }
      };

      const queryResults = {
        entities: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={sectionWithoutConfig}
          />
        );
      });

      const graphElement = screen.getByTestId('graph-bar-entities');
      expect(graphElement).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles null data gracefully', async () => {
      const queryResults = {
        entities: null
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={barChartReportSection}
          />
        );
      });

      expect(screen.getByText(/No data available for graph:/)).toBeInTheDocument();
    });

    it('handles unknown graph type', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const unknownGraphTypeSection: GraphReportSection = {
        type: "graphReportSection",
        definition: {
          label: "Unknown Graph Type",
          fetchedDataReference: "entities",
          graphType: "unknown" as any,
          dataMapping: {
            labelField: "name",
            valueField: "value"
          }
        }
      };

      const queryResults = {
        entities: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={unknownGraphTypeSection}
          />
        );
      });

      // Should still render as bar chart (fallback)
      const graphElement = screen.getByTestId('graph-unknown-entities');
      expect(graphElement).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('GraphReportSectionView: Unknown graph type', 'unknown');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Display', () => {
    it('shows performance metrics when enabled', async () => {
      const queryResults = {
        entities: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={barChartReportSection}
            showPerformanceDisplay={true}
          />
        );
      });

      expect(screen.getByText(/GraphReportSectionView renders:/)).toBeInTheDocument();
    });

    it('hides performance metrics when disabled', async () => {
      const queryResults = {
        entities: sampleEntityData
      };

      await act(async () => {
        renderWithTheme(
          <GraphReportSectionView
            applicationSection={"data" as ApplicationSection}
            deploymentUuid={deployment_Miroir.uuid}
            queryResults={queryResults}
            reportSection={barChartReportSection}
            showPerformanceDisplay={false}
          />
        );
      });

      expect(screen.queryByText(/GraphReportSectionView renders:/)).not.toBeInTheDocument();
    });
  });
});
