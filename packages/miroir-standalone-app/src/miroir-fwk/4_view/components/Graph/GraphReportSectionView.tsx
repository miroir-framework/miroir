import React, { useMemo } from 'react';

import {
  ApplicationSection,
  Domain2QueryReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  type GraphReportSection
} from "miroir-core";

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { GraphComponent } from './GraphComponent.js';
import { 
  GraphData, 
  GraphDataPoint, 
} from './GraphInterfaces.js';
import { ThemedBox } from '../Themes/LayoutComponents.js';
import { ThemedText } from '../Themes/BasicComponents.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "GraphReportSectionView")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// GraphReportSectionView Props
// ################################################################################################

export interface GraphReportSectionViewProps {
  applicationSection: ApplicationSection;
  deploymentUuid: Uuid;
  queryResults: Domain2QueryReturnType<Record<string,any>>;
  reportSection: GraphReportSection;
  showPerformanceDisplay?: boolean;
}

// ################################################################################################
// Data transformation utilities
// ################################################################################################

const transformDataToGraphFormat = (
  rawData: any[],
  dataMapping: GraphReportSection['definition']['dataMapping'],
  graphType: GraphReportSection['definition']['graphType']
): GraphDataPoint[] => {
  if (!Array.isArray(rawData)) {
    log.warn('GraphReportSectionView: rawData is not an array', rawData);
    return [];
  }

  //   "dataMapping": {
  //   "labelField": "labelField",
  //   "valueField": "ValueField"
  // }

  return rawData.map((item, index) => {
    const label = item[dataMapping.labelField]?.toString() || `Item ${index + 1}`;
    const value = Number(item[dataMapping.valueField]) || 0;
    const color = dataMapping.colorField ? item[dataMapping.colorField] : undefined;

    return {
      label,
      value,
      color
    };
  }).filter(item => !isNaN(item.value)); // Filter out invalid values
};

// ################################################################################################
// GraphReportSectionView Component
// ################################################################################################

export const GraphReportSectionView: React.FC<GraphReportSectionViewProps> = (props) => {
  // Track render counts with centralized tracker
  const currentNavigationKey = `${props.deploymentUuid}-${props.applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("GraphReportSectionView", currentNavigationKey);

  log.info(
    "########################## GraphReportSectionView render",
    "navigationCount",
    navigationCount,
    "totalCount",
    totalCount,
    "props.queryResults",
    props.queryResults,
    "props.reportSection.definition",
    props.reportSection.definition,
    // "props",
    // props
  );

  // Extract data from query results
  const rawData = useMemo(() => {
    const fetchedDataReference = props.reportSection.definition.fetchedDataReference;
    
    if (!fetchedDataReference) {
      log.warn('GraphReportSectionView: No fetchedDataReference provided');
      return [];
    }

    const data = (props.queryResults as any)[fetchedDataReference];
    
    if (!data) {
      log.warn('GraphReportSectionView: No data found for reference', fetchedDataReference);
      return [];
    }

    // Handle different data formats
    if (Array.isArray(data)) {
      return data;
    } else if (typeof data === 'object' && data !== null) {
      // If it's an object (like EntityInstancesUuidIndex), convert to array
      return Object.values(data);
    } else {
      log.warn('GraphReportSectionView: Unexpected data format', data);
      return [];
    }
  }, [props.queryResults, props.reportSection.definition.fetchedDataReference]);

  log.info(
    "GraphReportSectionView: rawData extracted",
    rawData
  );
  // Transform data to graph format
  const graphDataPoints = useMemo(() => {
    return transformDataToGraphFormat(
      rawData,
      props.reportSection.definition.dataMapping,
      props.reportSection.definition.graphType
    );
  }, [rawData, props.reportSection.definition.dataMapping, props.reportSection.definition.graphType]);

  log.info(
    "GraphReportSectionView: graphDataPoints transformed",
    graphDataPoints
  );

  // Create graph data object
  const graphData: GraphData = useMemo(() => {
    const baseData = {
      title: props.reportSection.definition.label,
      data: graphDataPoints,
      config: props.reportSection.definition.config
    };

    switch (props.reportSection.definition.graphType) {
      case 'bar':
        return { type: 'bar' as const, ...baseData };
      case 'line':
        return { type: 'line' as const, ...baseData };
      case 'pie':
        return { type: 'pie' as const, ...baseData };
      default:
        log.error('GraphReportSectionView: Unknown graph type', props.reportSection.definition.graphType);
        return { type: 'bar' as const, ...baseData };
    }
  }, [props.reportSection.definition, graphDataPoints]);

  log.info(
    "GraphReportSectionView: graphData prepared",
    graphData
  );
  // Render component
  if (graphDataPoints.length === 0) {
    return (
      <ThemedBox>
        {props.showPerformanceDisplay && (
          <ThemedText style={{ fontSize: '12px', opacity: 0.6, padding: '2px' }}>
            GraphReportSectionView renders: {navigationCount} (total: {totalCount})
          </ThemedText>
        )}
        <ThemedText>
          No data available for graph: {props.reportSection.definition.label || 'Untitled Graph'}
        </ThemedText>
        <ThemedText style={{ fontSize: '0.8em', opacity: 0.7 }}>
          Data reference: {props.reportSection.definition.fetchedDataReference}
        </ThemedText>
      </ThemedBox>
    );
  }

  return (
    <ThemedBox>
      {props.showPerformanceDisplay && (
        <ThemedText style={{ fontSize: '12px', opacity: 0.6, padding: '2px' }}>
          GraphReportSectionView renders: {navigationCount} (total: {totalCount})
        </ThemedText>
      )}
      <GraphComponent 
        graphData={graphData}
        data-testid={`graph-${props.reportSection.definition.graphType}-${props.reportSection.definition.fetchedDataReference}`}
      />
    </ThemedBox>
  );
};

export default GraphReportSectionView;
