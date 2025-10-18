/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { 
  BarChartData, 
  GraphConfig, 
  GraphData, 
  GraphDataPoint, 
  LineChartData, 
  PieChartData 
} from './GraphInterfaces';

// ################################################################################################
// Graph Component Props
// ################################################################################################

export interface GraphComponentProps {
  graphData: GraphData;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

// ################################################################################################
// Default configuration values
// ################################################################################################

// Type for fully resolved config (all fields required)
type ResolvedGraphConfig = {
  width: number;
  height: number;
  margins: { top: number; right: number; bottom: number; left: number };
  colors: string[];
  showLegend: boolean;
  showTooltips: boolean;
  labelPresentation: 'auto' | 'basic' | 'slanted' | 'separate';
  legendPosition: 'top-left' | 'top-right';
  slantAngle: number;
  fontSize: number;
};

const DEFAULT_CONFIG: ResolvedGraphConfig = {
  width: 600,
  height: 400,
  margins: { top: 50, right: 20, bottom: 40, left: 60 },
  colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
  showLegend: true,
  showTooltips: true,
  labelPresentation: 'auto',
  legendPosition: 'top-right',
  slantAngle: 45,
  fontSize: 12
};

// ################################################################################################
// Helper function to determine label presentation mode
// ################################################################################################

const determineLabelPresentation = (
  data: GraphDataPoint[],
  chartWidth: number,
  fontSize: number
): 'basic' | 'slanted' | 'separate' => {
  const dataLength = data.length;
  const spacePerLabel = chartWidth / dataLength;
  
  // Find the longest label
  const maxLabelLength = Math.max(...data.map(d => d.label.length));
  
  // Estimate label width (rough heuristic: 0.6 * fontSize per character)
  const estimatedLabelWidth = maxLabelLength * fontSize * 0.6;
  
  // Decision logic
  if (estimatedLabelWidth <= spacePerLabel) {
    // Labels fit comfortably - use basic
    return 'basic';
  } else if (dataLength <= 20 && estimatedLabelWidth <= spacePerLabel * 1.5) {
    // Medium number of items and labels almost fit - use slanted
    return 'slanted';
  } else {
    // Too many items or labels too long - use separate legend
    return 'separate';
  }
};

// ################################################################################################
// Helper function to render separate legend
// ################################################################################################

const renderSeparateLegend = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: GraphDataPoint[],
  colorScale: d3.ScaleOrdinal<string, string, never>,
  width: number,
  legendPosition: 'top-left' | 'top-right',
  fontSize: number,
  theme: any,
  onBarHighlight: (label: string | null) => void
) => {
  const legendItemHeight = fontSize + 8;
  const legendItemWidth = 150;
  const legendPadding = 10;
  
  // Calculate multi-column layout (max 3 columns)
  const maxColumns = Math.min(3, Math.ceil(width / legendItemWidth));
  const columns = Math.min(maxColumns, Math.ceil(data.length / 10)); // ~10 items per column
  const itemsPerColumn = Math.ceil(data.length / columns);
  
  // Position legend
  const legendX = legendPosition === 'top-left' ? legendPadding : width - (columns * legendItemWidth) - legendPadding;
  const legendY = 10;
  
  const legendGroup = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${legendX},${legendY})`);
  
  // Create legend items
  data.forEach((d, i) => {
    const column = Math.floor(i / itemsPerColumn);
    const row = i % itemsPerColumn;
    const x = column * legendItemWidth;
    const y = row * legendItemHeight;
    
    const itemGroup = legendGroup.append('g')
      .attr('class', 'legend-item')
      .attr('transform', `translate(${x},${y})`)
      .style('cursor', 'pointer')
      .on('mouseenter', () => onBarHighlight(d.label))
      .on('mouseleave', () => onBarHighlight(null));
    
    // Color rectangle
    itemGroup.append('rect')
      .attr('width', fontSize)
      .attr('height', fontSize)
      .attr('fill', d.color || colorScale(d.label) as string);
    
    // Label text
    itemGroup.append('text')
      .attr('x', fontSize + 5)
      .attr('y', fontSize * 0.75)
      .style('font-size', `${fontSize}px`)
      .style('fill', theme.colors?.text || '#000')
      .text(d.label);
  });
};

// ################################################################################################
// Bar Chart Implementation
// ################################################################################################

const renderBarChart = (
  svgElement: SVGSVGElement,
  data: BarChartData,
  config: ResolvedGraphConfig,
  theme: any
) => {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove(); // Clear previous content

  // Determine actual label presentation mode
  let actualLabelPresentation = config.labelPresentation;
  if (actualLabelPresentation === 'auto') {
    actualLabelPresentation = determineLabelPresentation(
      data.data,
      config.width - config.margins.left - config.margins.right,
      config.fontSize
    );
  }

  // Adjust margins for slanted labels if needed
  let adjustedMargins = { ...config.margins };
  if (actualLabelPresentation === 'slanted') {
    const maxLabelLength = Math.max(...data.data.map(d => d.label.length));
    const estimatedLabelWidth = maxLabelLength * config.fontSize * 0.6;
    const angleRad = (config.slantAngle * Math.PI) / 180;
    const requiredBottomMargin = Math.ceil(Math.abs(Math.sin(angleRad)) * estimatedLabelWidth) + 10;
    adjustedMargins.bottom = Math.max(adjustedMargins.bottom, requiredBottomMargin);
  }

  const { width, height } = config;
  const margins = adjustedMargins;
  const innerWidth = width - margins.left - margins.right;
  const innerHeight = height - margins.top - margins.bottom;

  // Create scales
  const xScale = d3.scaleBand()
    .domain(data.data.map(d => d.label))
    .range([0, innerWidth])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data.data, d => d.value) || 0])
    .range([innerHeight, 0]);

  const colorScale = d3.scaleOrdinal<string, string>()
    .domain(data.data.map(d => d.label))
    .range(config.colors);

  // Create main group
  const g = svg.append('g')
    .attr('transform', `translate(${margins.left},${margins.top})`);

  // Add title
  if (data.title) {
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margins.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', theme.colors?.text || '#000')
      .text(data.title);
  }

  // Create tooltip if enabled
  let tooltip: any;
  if (config.showTooltips) {
    tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('background', theme.colors?.backgroundPaper || '#fff')
      .style('border', `1px solid ${theme.colors?.divider || '#ccc'}`)
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);
  }

  // Track highlighted bar for legend interaction
  let highlightedLabel: string | null = null;

  const updateBarHighlight = (label: string | null) => {
    highlightedLabel = label;
    g.selectAll('.bar')
      .style('opacity', (d: any) => {
        if (highlightedLabel === null) return 1;
        return d.label === highlightedLabel ? 1 : 0.3;
      });
  };

  // Add bars
  g.selectAll('.bar')
    .data(data.data)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.label) || 0)
    .attr('y', d => yScale(d.value))
    .attr('width', xScale.bandwidth())
    .attr('height', d => innerHeight - yScale(d.value))
    .attr('fill', d => d.color || colorScale(d.label) as string)
    .style('cursor', config.showTooltips ? 'pointer' : 'default')
    .on('mouseover', function(event, d) {
      if (config.showTooltips && tooltip) {
        d3.select(this).style('opacity', 0.8);
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`<strong>${d.label}</strong><br/>Value: ${d.value}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      }
    })
    .on('mouseout', function() {
      if (config.showTooltips && tooltip) {
        const opacity = highlightedLabel === null ? 1 : 
          (d3.select(this).datum() as GraphDataPoint).label === highlightedLabel ? 1 : 0.3;
        d3.select(this).style('opacity', opacity);
        tooltip.transition().duration(500).style('opacity', 0);
      }
    });

  // Render x-axis based on label presentation mode
  if (actualLabelPresentation === 'separate') {
    // No x-axis labels for separate mode, just render the axis line
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(() => ''))
      .selectAll('text')
      .remove();
    
    // Render separate legend
    renderSeparateLegend(
      svg,
      data.data,
      colorScale,
      width,
      config.legendPosition,
      config.fontSize,
      theme,
      updateBarHighlight
    );
  } else if (actualLabelPresentation === 'slanted') {
    // Render slanted labels
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));
    
    xAxis.selectAll('text')
      .style('text-anchor', 'end')
      .style('font-size', `${config.fontSize}px`)
      .style('fill', theme.colors?.text || '#000')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', `rotate(-${config.slantAngle})`);
  } else {
    // Basic mode - standard horizontal labels
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('font-size', `${config.fontSize}px`)
      .style('fill', theme.colors?.text || '#000');
  }

  // Add y-axis
  g.append('g')
    .call(d3.axisLeft(yScale))
    .selectAll('text')
    .style('fill', theme.colors?.text || '#000');

  // Style axis lines
  g.selectAll('.domain, .tick line')
    .style('stroke', theme.colors?.textSecondary || '#666');
};

// ################################################################################################
// Line Chart Implementation
// ################################################################################################

const renderLineChart = (
  svgElement: SVGSVGElement,
  data: LineChartData,
  config: ResolvedGraphConfig,
  theme: any
) => {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const { width, height, margins } = config;
  const innerWidth = width - margins.left - margins.right;
  const innerHeight = height - margins.top - margins.bottom;

  // Create scales
  const xScale = d3.scalePoint()
    .domain(data.data.map(d => d.label))
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data.data, d => d.value) as [number, number])
    .range([innerHeight, 0]);

  // Create line generator
  const line = d3.line<GraphDataPoint>()
    .x(d => xScale(d.label) || 0)
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);

  // Create main group
  const g = svg.append('g')
    .attr('transform', `translate(${margins.left},${margins.top})`);

  // Add title
  if (data.title) {
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margins.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', theme.colors?.text || '#000')
      .text(data.title);
  }

  // Create tooltip if enabled
  let tooltip: any;
  if (config.showTooltips) {
    tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('background', theme.colors?.backgroundPaper || '#fff')
      .style('border', `1px solid ${theme.colors?.divider || '#ccc'}`)
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);
  }

  // Add line
  g.append('path')
    .datum(data.data)
    .attr('fill', 'none')
    .attr('stroke', config.colors[0])
    .attr('stroke-width', 2)
    .attr('d', line);

  // Add points
  g.selectAll('.point')
    .data(data.data)
    .enter().append('circle')
    .attr('class', 'point')
    .attr('cx', d => xScale(d.label) || 0)
    .attr('cy', d => yScale(d.value))
    .attr('r', 4)
    .attr('fill', d => d.color || config.colors[0])
    .style('cursor', config.showTooltips ? 'pointer' : 'default')
    .on('mouseover', function(event, d) {
      if (config.showTooltips && tooltip) {
        d3.select(this).attr('r', 6);
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`<strong>${d.label}</strong><br/>Value: ${d.value}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      }
    })
    .on('mouseout', function() {
      if (config.showTooltips && tooltip) {
        d3.select(this).attr('r', 4);
        tooltip.transition().duration(500).style('opacity', 0);
      }
    });

  // Add x-axis
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .style('fill', theme.colors?.text || '#000');

  // Add y-axis
  g.append('g')
    .call(d3.axisLeft(yScale))
    .selectAll('text')
    .style('fill', theme.colors?.text || '#000');

  // Style axis lines
  g.selectAll('.domain, .tick line')
    .style('stroke', theme.colors?.textSecondary || '#666');
};

// ################################################################################################
// Pie Chart Implementation
// ################################################################################################

const renderPieChart = (
  svgElement: SVGSVGElement,
  data: PieChartData,
  config: ResolvedGraphConfig,
  theme: any
) => {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const { width, height } = config;
  const radius = Math.min(width, height) / 2 - 40;

  // Create pie layout
  const pie = d3.pie<GraphDataPoint>()
    .value(d => d.value)
    .sort(null);

  // Create arc generator
  const arc = d3.arc<d3.PieArcDatum<GraphDataPoint>>()
    .innerRadius(0)
    .outerRadius(radius);

  const outerArc = d3.arc<d3.PieArcDatum<GraphDataPoint>>()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9);

  // Color scale
  const colorScale = d3.scaleOrdinal()
    .domain(data.data.map(d => d.label))
    .range(config.colors);

  // Create main group
  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  // Add title
  if (data.title) {
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', DEFAULT_CONFIG.margins.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .style('fill', theme.colors?.text || '#000')
      .text(data.title);
  }

  // Create tooltip if enabled
  let tooltip: any;
  if (config.showTooltips) {
    tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('background', theme.colors?.backgroundPaper || '#fff')
      .style('border', `1px solid ${theme.colors?.divider || '#ccc'}`)
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);
  }

  // Create pie slices
  const slices = g.selectAll('.slice')
    .data(pie(data.data))
    .enter().append('g')
    .attr('class', 'slice');

  // Add pie slices
  slices.append('path')
    .attr('d', arc)
    .attr('fill', d => d.data.color || colorScale(d.data.label) as string)
    .style('cursor', config.showTooltips ? 'pointer' : 'default')
    .on('mouseover', function(event, d) {
      if (config.showTooltips && tooltip) {
        d3.select(this).style('opacity', 0.8);
        const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(`<strong>${d.data.label}</strong><br/>Value: ${d.data.value}<br/>Percentage: ${percentage}%`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      }
    })
    .on('mouseout', function() {
      if (config.showTooltips && tooltip) {
        d3.select(this).style('opacity', 1);
        tooltip.transition().duration(500).style('opacity', 0);
      }
    });

  // Add labels
  slices.append('text')
    .attr('transform', d => `translate(${outerArc.centroid(d)})`)
    .attr('dy', '.35em')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', theme.colors?.text || '#000')
    .text(d => d.data.label);

  // Add legend if enabled
  if (config.showLegend) {
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 120}, 40)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(data.data)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect')
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', d => d.color || colorScale(d.label) as string);

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .style('font-size', '12px')
      .style('fill', theme.colors?.text || '#000')
      .text(d => d.label);
  }
};

// ################################################################################################
// Main Graph Component
// ################################################################################################

export const GraphComponent: React.FC<GraphComponentProps> = ({
  graphData,
  className,
  style,
  'data-testid': dataTestId
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { currentTheme } = useMiroirTheme();

  // Merge default config with provided config
  const config: ResolvedGraphConfig = {
    ...DEFAULT_CONFIG,
    ...graphData.config
  };

  // Container styles using theme
  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: currentTheme.spacing?.md || '16px',
    backgroundColor: currentTheme.colors?.background || '#fff',
    border: `1px solid ${currentTheme.colors?.divider || '#e0e0e0'}`,
    borderRadius: currentTheme.borderRadius?.md || '4px',
    fontFamily: currentTheme.typography?.fontFamily || 'inherit',
    // marginTop: currentTheme.spacing?.md || '16px',
    ...style
  });

  useEffect(() => {
    if (!svgRef.current) return;

    // Clean up any existing tooltips
    d3.selectAll('.graph-tooltip').remove();

    // Set up SVG dimensions
    const svg = d3.select(svgRef.current);
    svg.attr('width', config.width)
       .attr('height', config.height);

    // Render based on graph type
    switch (graphData.type) {
      case 'bar':
        renderBarChart(svgRef.current, graphData, config, currentTheme);
        break;
      case 'line':
        renderLineChart(svgRef.current, graphData, config, currentTheme);
        break;
      case 'pie':
        renderPieChart(svgRef.current, graphData, config, currentTheme);
        break;
      default:
        console.warn('Unknown graph type:', (graphData as any).type);
    }

    // Cleanup function to remove tooltips when component unmounts
    return () => {
      d3.selectAll('.graph-tooltip').remove();
    };
  }, [graphData, config, currentTheme]);

  return (
    <div 
      css={containerStyles}
      className={className}
      data-testid={dataTestId}
    >
      <svg ref={svgRef} />
    </div>
  );
};

export default GraphComponent;
