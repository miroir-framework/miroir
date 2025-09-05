import { MiroirEventServiceInterface, MiroirEvent } from "./MiroirEventService";
import { MiroirEventTrackingData, MiroirEventTrackerInterface } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import { 
  TransformerEntry, 
  TransformerEvent, 
  TransformerEventFilter, 
  TransformerEventServiceInterface 
} from "../0_interfaces/3_controllers/TransformerEventInterface";

/**
 * Service that provides transformer-specific view of events from MiroirEventService
 */
export class TransformerEventService implements TransformerEventServiceInterface {
  private subscribers: Set<(transformerEvents: TransformerEvent[]) => void> = new Set();
  private unsubscribeFromEventService: (() => void) | undefined;

  constructor(
    private eventService: MiroirEventServiceInterface,
    private eventTracker: MiroirEventTrackerInterface
  ) {
    // Subscribe to the main event service and filter for transformer events
    this.unsubscribeFromEventService = this.eventService.subscribe((events: MiroirEvent[]) => {
      const transformerEvents = this.convertEventsToTransformerEvents(events);
      this.notifySubscribers(transformerEvents);
    });
  }

  private convertEventsToTransformerEvents(events: MiroirEvent[]): TransformerEvent[] {
    return events
      .filter(event => event.trackingType === 'transformer')
      .map(event => this.convertEventToTransformerEvent(event));
  }

  private convertEventToTransformerEvent(event: MiroirEvent): TransformerEvent {
    // Only process transformer events
    if (event.trackingType !== 'transformer') {
      throw new Error('Cannot convert non-transformer event to TransformerEvent');
    }
    
    // Get the tracking data from the event tracker to access hierarchical fields
    const trackingData = this.eventTracker.getAllEvents().find((data: MiroirEventTrackingData) => data.id === event.eventId);
    
    return {
      transformerId: event.eventId,
      transformerName: event.transformerName || event.actionLabel || 'Unknown',
      transformerType: event.transformerType || 'unknown',
      transformerStep: event.transformerStep || 'runtime',
      startTime: event.startTime,
      endTime: event.endTime,
      duration: event.endTime ? event.endTime - event.startTime : undefined,
      status: event.status,
      transformerParams: event.transformerParams,
      transformerResult: event.transformerResult,
      transformerError: event.transformerError,
      logs: event.eventLogs.map((log: any) => this.convertLogToTransformerEntry(log)),
      logCounts: event.logCounts,
      parentTransformerId: trackingData?.parentId,
      children: trackingData?.children || [],
      depth: trackingData?.depth || 0,
    };
  }

  private convertLogToTransformerEntry(log: any): TransformerEntry {
    return {
      id: log.id,
      transformerId: log.eventId,
      timestamp: log.timestamp,
      level: log.level,
      loggerName: log.loggerName,
      message: log.message,
      args: log.args,
      context: {
        transformerName: log.context?.transformerName,
        transformerType: log.context?.transformerType,
        transformerStep: log.context?.transformerStep,
        parentTransformerId: log.context?.parentTransformerId,
      },
    };
  }

  getTransformerEvent(transformerId: string): TransformerEvent | undefined {
    const event = this.eventService.getEvent(transformerId);
    if (event && event.trackingType === 'transformer') {
      return this.convertEventToTransformerEvent(event);
    }
    return undefined;
  }

  getAllTransformerEvents(): TransformerEvent[] {
    const allEvents = this.eventService.getAllEvents();
    return this.convertEventsToTransformerEvents(allEvents);
  }

  getFilteredTransformerEvents(filter: TransformerEventFilter): TransformerEvent[] {
    // Convert transformer filter to action log filter
    const actionFilter = {
      trackingType: 'transformer' as const,
      eventId: filter.transformerId,
      actionType: filter.transformerType,
      level: filter.level,
      since: filter.since,
      searchText: filter.searchText,
      loggerName: filter.loggerName,
    };

    const filteredEvents = this.eventService.getFilteredEvents(actionFilter);
    const transformerEvents = this.convertEventsToTransformerEvents(filteredEvents);

    // Apply transformer-specific filters
    return transformerEvents.filter(event => {
      if (filter.transformerName && !event.transformerName.toLowerCase().includes(filter.transformerName.toLowerCase())) {
        return false;
      }
      if (filter.transformerStep && event.transformerStep !== filter.transformerStep) {
        return false;
      }
      if (filter.status && event.status !== filter.status) {
        return false;
      }
      if (filter.minDuration && (!event.duration || event.duration < filter.minDuration)) {
        return false;
      }
      if (filter.maxDuration && (!event.duration || event.duration > filter.maxDuration)) {
        return false;
      }
      return true;
    });
  }

  subscribe(callback: (transformerEvents: TransformerEvent[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  clear(): void {
    this.eventService.clear();
  }

  exportTransformerEvents(): string {
    const transformerEvents = this.getAllTransformerEvents();
    const exportData = {
      timestamp: new Date().toISOString(),
      transformerEvents: transformerEvents.map(event => ({
        ...event,
        logs: event.logs.map(log => ({
          ...log,
          timestampISO: new Date(log.timestamp).toISOString()
        }))
      }))
    };
    return JSON.stringify(exportData, null, 2);
  }

  private notifySubscribers(transformerEvents: TransformerEvent[]): void {
    this.subscribers.forEach(callback => {
      try {
        callback(transformerEvents);
      } catch (error) {
        console.error('Error in TransformerEventService subscriber:', error);
      }
    });
  }

  destroy(): void {
    if (this.unsubscribeFromEventService) {
      this.unsubscribeFromEventService();
    }
    this.subscribers.clear();
  }
}
