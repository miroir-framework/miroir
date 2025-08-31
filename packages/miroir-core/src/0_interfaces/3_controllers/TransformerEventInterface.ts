// Transformer Event interfaces

export interface TransformerEntry {
  id: string;
  transformerId: string; // The ID of the transformer execution
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  loggerName: string;
  message: string;
  args: any[];
  context?: {
    transformerName?: string;
    transformerType?: string;
    transformerStep?: 'build' | 'runtime';
    parentTransformerId?: string;
  };
}

export interface TransformerEvent {
  transformerId: string;
  transformerName: string;
  transformerType: string;
  transformerStep: 'build' | 'runtime';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'error';
  transformerParams?: any;
  transformerResult?: any;
  transformerError?: string;
  logs: TransformerEntry[];
  logCounts: {
    trace: number;
    debug: number;
    info: number;
    warn: number;
    error: number;
    total: number;
  };
  parentTransformerId?: string;
  children: string[];
  depth: number;
}

export interface TransformerEventFilter {
  transformerId?: string;
  transformerName?: string;
  transformerType?: string;
  transformerStep?: 'build' | 'runtime';
  status?: 'running' | 'completed' | 'error';
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  since?: number;
  searchText?: string;
  loggerName?: string;
  minDuration?: number;
  maxDuration?: number;
}

export interface TransformerEventServiceInterface {
  /**
   * Get transformer events for a specific transformer execution
   */
  getTransformerEvent(transformerId: string): TransformerEvent | undefined;

  /**
   * Get all transformer events
   */
  getAllTransformerEvents(): TransformerEvent[];

  /**
   * Get filtered transformer events
   */
  getFilteredTransformerEvents(filter: TransformerEventFilter): TransformerEvent[];

  /**
   * Subscribe to transformer event updates
   */
  subscribe(callback: (transformerEvents: TransformerEvent[]) => void): () => void;

  /**
   * Clear all transformer events
   */
  clear(): void;

  /**
   * Export transformer events as JSON
   */
  exportTransformerEvents(): string;
}
