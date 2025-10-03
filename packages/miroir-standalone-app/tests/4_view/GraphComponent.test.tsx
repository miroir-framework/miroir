import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';

import { MiroirThemeProvider } from '../../src/miroir-fwk/4_view/contexts/MiroirThemeContext';
import { GraphComponent } from '../../src/miroir-fwk/4_view/components/Graph/GraphComponent';
import { BarChartData, LineChartData, PieChartData } from '../../src/miroir-fwk/4_view/components/Graph/GraphInterfaces';

// Mock d3 to avoid DOM manipulation issues in tests
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
            call: vi.fn(() => ({ selectAll: vi.fn(() => ({ style: vi.fn() })) }))
          }))
        }))
      }))
    })),
    append: vi.fn(() => ({
      attr: vi.fn().mockReturnThis(),
      style: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      datum: vi.fn().mockReturnThis(),
      selectAll: vi.fn(() => ({ 
        data: vi.fn(() => ({
          enter: vi.fn(() => ({
            append: vi.fn(() => ({
              attr: vi.fn().mockReturnThis(),
              style: vi.fn().mockReturnThis(),
              on: vi.fn().mockReturnThis(),
              text: vi.fn().mockReturnThis()
            }))
          }))
        }))
      })),
      call: vi.fn().mockReturnThis()
    })),
    attr: vi.fn().mockReturnThis()
  })),
  selectAll: vi.fn(() => ({
    remove: vi.fn(),
  })),
  scaleBand: vi.fn(() => {
    const scale: any = vi.fn(() => 0);
    scale.domain = vi.fn(() => scale);
    scale.range = vi.fn(() => scale);
    scale.padding = vi.fn(() => scale);
    scale.bandwidth = vi.fn(() => 50);
    return scale;
  }),
  scaleLinear: vi.fn(() => {
    const scale: any = vi.fn(() => 0);
    scale.domain = vi.fn(() => scale);
    scale.range = vi.fn(() => scale);
    return scale;
  }),
  scalePoint: vi.fn(() => {
    const scale: any = vi.fn(() => 0);
    scale.domain = vi.fn(() => scale);
    scale.range = vi.fn(() => scale);
    return scale;
  }),
  scaleOrdinal: vi.fn(() => {
    const scale: any = vi.fn(() => '#1f77b4');
    scale.domain = vi.fn(() => scale);
    scale.range = vi.fn(() => scale);
    return scale;
  }),
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
const barChartTestData: BarChartData = {
  type: 'bar',
  title: 'Test Bar Chart',
  data: [
    { label: 'A', value: 10 },
    { label: 'B', value: 20 },
    { label: 'C', value: 15 }
  ],
  config: {
    width: 400,
    height: 300,
    showTooltips: true,
    showLegend: false
  }
};

const lineChartTestData: LineChartData = {
  type: 'line',
  title: 'Test Line Chart',
  data: [
    { label: 'Jan', value: 10 },
    { label: 'Feb', value: 20 },
    { label: 'Mar', value: 15 }
  ]
};

const pieChartTestData: PieChartData = {
  type: 'pie',
  title: 'Test Pie Chart',
  data: [
    { label: 'Slice A', value: 30, color: '#ff0000' },
    { label: 'Slice B', value: 50, color: '#00ff00' },
    { label: 'Slice C', value: 20, color: '#0000ff' }
  ],
  config: {
    showLegend: true
  }
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <MiroirThemeProvider>
      {component}
    </MiroirThemeProvider>
  );
};

describe('GraphComponent', () => {
  describe('Bar Chart', () => {
    it('renders bar chart component', () => {
      renderWithTheme(
        <GraphComponent 
          graphData={barChartTestData} 
          data-testid="bar-chart"
        />
      );
      
      const chartElement = screen.getByTestId('bar-chart');
      expect(chartElement).toBeInTheDocument();
    });

    it('renders with custom styling', () => {
      const customStyle = { backgroundColor: 'red', padding: '20px' };
      
      renderWithTheme(
        <GraphComponent 
          graphData={barChartTestData}
          style={customStyle}
          data-testid="styled-bar-chart"
        />
      );
      
      const chartElement = screen.getByTestId('styled-bar-chart');
      expect(chartElement).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      renderWithTheme(
        <GraphComponent 
          graphData={barChartTestData}
          className="custom-chart-class"
          data-testid="custom-class-chart"
        />
      );
      
      const chartElement = screen.getByTestId('custom-class-chart');
      expect(chartElement).toBeInTheDocument();
      expect(chartElement).toHaveClass('custom-chart-class');
    });
  });

  describe('Line Chart', () => {
    it('renders line chart component', () => {
      renderWithTheme(
        <GraphComponent 
          graphData={lineChartTestData} 
          data-testid="line-chart"
        />
      );
      
      const chartElement = screen.getByTestId('line-chart');
      expect(chartElement).toBeInTheDocument();
    });

    it('handles line chart data correctly', () => {
      const { container } = renderWithTheme(
        <GraphComponent 
          graphData={lineChartTestData} 
          data-testid="line-chart-data"
        />
      );
      
      // Check that SVG element is created
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });
  });

  describe('Pie Chart', () => {
    it('renders pie chart component', () => {
      renderWithTheme(
        <GraphComponent 
          graphData={pieChartTestData} 
          data-testid="pie-chart"
        />
      );
      
      const chartElement = screen.getByTestId('pie-chart');
      expect(chartElement).toBeInTheDocument();
    });

    it('handles pie chart with custom colors', () => {
      const { container } = renderWithTheme(
        <GraphComponent 
          graphData={pieChartTestData} 
          data-testid="pie-chart-colors"
        />
      );
      
      // Check that SVG element is created
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('applies default configuration when none provided', () => {
      const dataWithoutConfig = {
        ...barChartTestData,
        config: undefined
      };
      
      renderWithTheme(
        <GraphComponent 
          graphData={dataWithoutConfig} 
          data-testid="default-config-chart"
        />
      );
      
      const chartElement = screen.getByTestId('default-config-chart');
      expect(chartElement).toBeInTheDocument();
    });

    it('merges custom configuration with defaults', () => {
      const dataWithPartialConfig = {
        ...barChartTestData,
        config: {
          width: 800,
          showTooltips: false
          // height, margins, colors, showLegend should use defaults
        }
      };
      
      renderWithTheme(
        <GraphComponent 
          graphData={dataWithPartialConfig} 
          data-testid="partial-config-chart"
        />
      );
      
      const chartElement = screen.getByTestId('partial-config-chart');
      expect(chartElement).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('handles empty data array', () => {
      const emptyDataChart = {
        ...barChartTestData,
        data: []
      };
      
      renderWithTheme(
        <GraphComponent 
          graphData={emptyDataChart} 
          data-testid="empty-data-chart"
        />
      );
      
      const chartElement = screen.getByTestId('empty-data-chart');
      expect(chartElement).toBeInTheDocument();
    });

    it('handles data with missing values', () => {
      const dataWithMissingValues = {
        ...barChartTestData,
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 0 },
          { label: 'C', value: 15 }
        ]
      };
      
      renderWithTheme(
        <GraphComponent 
          graphData={dataWithMissingValues} 
          data-testid="missing-values-chart"
        />
      );
      
      const chartElement = screen.getByTestId('missing-values-chart');
      expect(chartElement).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles unknown graph type gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const unknownTypeData = {
        type: 'unknown' as any,
        title: 'Unknown Chart',
        data: [{ label: 'A', value: 10 }]
      };
      
      renderWithTheme(
        <GraphComponent 
          graphData={unknownTypeData} 
          data-testid="unknown-type-chart"
        />
      );
      
      const chartElement = screen.getByTestId('unknown-type-chart');
      expect(chartElement).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Unknown graph type:', 'unknown');
      
      consoleSpy.mockRestore();
    });
  });
});
