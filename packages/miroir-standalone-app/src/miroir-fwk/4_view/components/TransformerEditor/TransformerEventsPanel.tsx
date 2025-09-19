import {
  getInnermostTransformerError,
  LoggerInterface,
  MiroirLoggerFactory,
  type EventFilter,
  type MiroirEvent,
  type MiroirEventLog,
  type TransformerEvent,
  type TransformerFailure
} from 'miroir-core';
import React, { useMemo, useState } from 'react';

import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';
import { useMiroirContextService, useMiroirEvents } from '../../MiroirContextReactProvider';
import {
  ThemedCodeBlock,
  ThemedContainer,
  ThemedHeaderSection,
  ThemedText,
  ThemedTitle,
} from "../Themes/index";

// ################################################################################################
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerEventsPanel")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export interface TransformerEventsPanelProps {
  /**
   * Optional filter for which transformer events to display
   * If not provided, shows all transformer events
   */
  transformerFilter?: EventFilter;
}

// ################################################################################################
const formatDuration = (duration?: number): string => {
  if (!duration) return 'N/A';
  return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
};

// ################################################################################################
const TransformerEventEntry: React.FC<{
  event: TransformerEvent;
  depth: number;
}> = React.memo(({ event, depth }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activity = event.activity;
  const hasDetails =
    activity.transformerParams ||
    activity.transformerResult ||
    activity.transformerError ||
    event.eventLogs?.length > 0;
  
  const statusColor = activity.status === 'error' ? '#ff6b6b' : 
                     activity.status === 'completed' ? '#51cf66' : '#ffd43b';
  
  const indentStyle = {
    marginLeft: `${depth * 20}px`,
    borderLeft: depth > 0 ? '2px solid #e9ecef' : 'none',
    paddingLeft: depth > 0 ? '10px' : '0px',
  };

  log.info("Rendering TransformerEventEntry", event, depth, isExpanded, hasDetails );
  
  // const preciseError: Domain2ElementFailed | undefined = useMemo(() => {
  const preciseError: TransformerFailure | undefined = useMemo(() => {
    if (activity.transformerError) {
      return getInnermostTransformerError(activity.transformerError as any);
    }
  }, [activity.transformerError]);

  return (
    <div style={{ ...indentStyle, marginBottom: '8px' }}>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          border: `1px solid ${statusColor}`,
          borderLeftWidth: '4px',
          cursor: hasDetails ? 'pointer' : 'default'
        }}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {activity.transformerName} ({activity.transformerType})
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {activity.transformerStep} • {formatDuration(activity.endTime? activity.endTime - activity.startTime:undefined)} • {event.activity.status}
            {activity.transformerError && <span style={{ color: '#ff6b6b', marginLeft: '8px' }}>Error</span>}
          </div>
        </div>
        
        {hasDetails && (
          <div style={{ marginLeft: '8px', color: '#666' }}>
            {isExpanded ? '▼' : '▶'}
          </div>
        )}
      </div>
      
      {/* ERROR */}
      {isExpanded && hasDetails && (
        <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '4px' }}>
          {activity.transformerError && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff6b6b' }}>Error:</div>
              <ThemedCodeBlock style={{ backgroundColor: '#fff5f5', border: '1px solid #ff6b6b' }}>
                {/* {event.transformerError} */}
                {preciseError ? JSON.stringify(preciseError, null, 2) : activity.transformerError}
              </ThemedCodeBlock>
            </div>
          )}
          
          {/* LOGS */}
          {event.eventLogs && event.eventLogs.length > 0 && (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Logs ({event.eventLogs.length}):</div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {/* {event.eventLogs.map((logEntry: TransformerEntry, index: number) => ( */}
                {event.eventLogs.map((logEntry: MiroirEventLog, index: number) => (
                  <div key={index} style={{ 
                    padding: '4px 8px', 
                    marginBottom: '2px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '2px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}>
                    <span style={{ color: '#666' }}>[{logEntry.level}]</span>{' '}
                    {logEntry.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activity.transformerParams && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Parameters:</div>
              <ThemedCodeBlock>
                {JSON.stringify(activity.transformerParams, null, 2)}
              </ThemedCodeBlock>
            </div>
          )}
          
          {activity.transformerResult && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Result:</div>
              <ThemedCodeBlock>
                {JSON.stringify(activity.transformerResult, null, 2)}
              </ThemedCodeBlock>
            </div>
          )}
          
        </div>
      )}
      
      {/* Render child events */}
      {/* {event.children && event.children.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {event.children.map((childId: string) => (
            <div key={childId} style={{ marginLeft: '20px', opacity: 0.8 }}>
              <div style={{ fontSize: '12px', color: '#666', padding: '4px 0' }}>
                └ Child transformer: {childId}
              </div>
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
});

// ################################################################################################
export const TransformerEventsPanel: React.FC<TransformerEventsPanelProps> = ({
  transformerFilter = {}
}) => {
  const { miroirContext } = useMiroirContextService();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const allEvents: MiroirEvent[] = useMiroirEvents();

  // Filter and sort events for display
  const displayEvents = useMemo(() => {
    if (!allEvents.length) return [];
    
      const filterCriteria: EventFilter = { trackingType: "transformer" };

    // Sort by start time, newest first
    return miroirContext.miroirEventService.getFilteredEvents(filterCriteria, allEvents)
      .sort((a, b) => (b.activity.startTime || 0) - (a.activity.startTime || 0));
  }, [allEvents]);

  if (!miroirContext.miroirEventService) {
    return (
      <ThemedContainer style={{ marginTop: '16px' }}>
        <ThemedHeaderSection>
          <ThemedTitle>Transformer Events</ThemedTitle>
          <ThemedText>Transformer event service not available</ThemedText>
        </ThemedHeaderSection>
      </ThemedContainer>
    );
  }

  return (
    <ThemedContainer style={{ marginTop: '16px' }}>
      <ThemedHeaderSection>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedTitle>
            Transformer Events {displayEvents.length > 0 && `(${displayEvents.length} / ${allEvents.length})`}
          </ThemedTitle>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </ThemedHeaderSection>
      
      {!isCollapsed && (
        <div style={{ padding: '16px 0' }}>
          {displayEvents.length > 0 ? (
            <div>
              {displayEvents.map((event: any) => (
                <TransformerEventEntry
                  key={event.transformerId}
                  event={event}
                  depth={event.depth || 0}
                />
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '32px 16px',
              color: '#666',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>
                No transformer events yet.
              </div>
              <div style={{ fontSize: "12px" }}>
                Execute a transformer to see events and logs here.
              </div>
            </div>
          )}
        </div>
      )}
    </ThemedContainer>
  );
};

TransformerEventsPanel.displayName = 'TransformerEventsPanel';
