import React, { useState, useEffect, useMemo } from 'react';
import {
  LoggerInterface,
  MiroirLoggerFactory,
  TransformerEntry,
  TransformerEvent,
  TransformerEventFilter,
} from 'miroir-core';

import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';
import {
  ThemedContainer,
  ThemedHeaderSection,
  ThemedText,
  ThemedTitle,
  ThemedCodeBlock,
} from "../Themes/index";
import { useMiroirContextService } from '../../MiroirContextReactProvider';

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
  transformerFilter?: TransformerEventFilter;
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
  
  const hasDetails = event.transformerParams || event.transformerResult || event.transformerError || event.logs?.length > 0;
  
  const statusColor = event.status === 'error' ? '#ff6b6b' : 
                     event.status === 'completed' ? '#51cf66' : '#ffd43b';
  
  const indentStyle = {
    marginLeft: `${depth * 20}px`,
    borderLeft: depth > 0 ? '2px solid #e9ecef' : 'none',
    paddingLeft: depth > 0 ? '10px' : '0px',
  };

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
            {event.transformerName} ({event.transformerType})
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {event.transformerStep} • {formatDuration(event.duration)} • {event.status}
            {event.transformerError && <span style={{ color: '#ff6b6b', marginLeft: '8px' }}>Error</span>}
          </div>
        </div>
        
        {hasDetails && (
          <div style={{ marginLeft: '8px', color: '#666' }}>
            {isExpanded ? '▼' : '▶'}
          </div>
        )}
      </div>
      
      {isExpanded && hasDetails && (
        <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '4px' }}>
          {event.transformerParams && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Parameters:</div>
              <ThemedCodeBlock>
                {JSON.stringify(event.transformerParams, null, 2)}
              </ThemedCodeBlock>
            </div>
          )}
          
          {event.transformerResult && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Result:</div>
              <ThemedCodeBlock>
                {JSON.stringify(event.transformerResult, null, 2)}
              </ThemedCodeBlock>
            </div>
          )}
          
          {event.transformerError && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ff6b6b' }}>Error:</div>
              <ThemedCodeBlock style={{ backgroundColor: '#fff5f5', border: '1px solid #ff6b6b' }}>
                {event.transformerError}
              </ThemedCodeBlock>
            </div>
          )}
          
          {event.logs && event.logs.length > 0 && (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Logs ({event.logs.length}):</div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {event.logs.map((logEntry: TransformerEntry, index: number) => (
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
        </div>
      )}
      
      {/* Render child events */}
      {event.children && event.children.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {event.children.map((childId: string) => (
            <div key={childId} style={{ marginLeft: '20px', opacity: 0.8 }}>
              <div style={{ fontSize: '12px', color: '#666', padding: '4px 0' }}>
                └ Child transformer: {childId}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ################################################################################################
export const TransformerEventsPanel: React.FC<TransformerEventsPanelProps> = React.memo(({
  transformerFilter = {}
}) => {
  const { miroirContext } = useMiroirContextService();
  const [transformerEvents, setTransformerEvents] = useState<TransformerEvent[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Subscribe to transformer events
  useEffect(() => {
    if (!miroirContext.transformerEventService) {
      log.warn('TransformerEventsPanel: No transformer event service available');
      return;
    }

    const unsubscribe = miroirContext.transformerEventService.subscribe((events: TransformerEvent[]) => {
      setTransformerEvents(events);
    });

    // Get initial events
    try {
      const initialEvents = miroirContext.transformerEventService.getFilteredTransformerEvents(transformerFilter);
      setTransformerEvents(initialEvents);
    } catch (error: any) {
      log.error('Failed to get initial transformer events:', error);
      setTransformerEvents([]);
    }

    return unsubscribe;
  }, [miroirContext.transformerEventService, transformerFilter]);

  // Filter and sort events for display
  const displayEvents = useMemo(() => {
    if (!transformerEvents.length) return [];
    
    // Sort by start time, newest first
    return transformerEvents
      .filter(event => !event.parentTransformerId) // Only show root events, children are shown nested
      .sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
  }, [transformerEvents]);

  if (!miroirContext.transformerEventService) {
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
            Transformer Events {transformerEvents.length > 0 && `(${transformerEvents.length})`}
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
              {displayEvents.map((event) => (
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
});

TransformerEventsPanel.displayName = 'TransformerEventsPanel';
