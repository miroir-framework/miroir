export interface ActionTrackingData {
  id: string;
  parentId?: string;
  actionType: string;
  actionLabel?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'error';
  error?: string;
  depth: number;
  children: string[];
}

export interface RunActionTrackerInterface {
  /**
   * Start tracking an action
   * @param actionType The type of action being tracked
   * @param actionLabel Optional label for the action
   * @param parentId Optional parent action ID for nested calls
   * @returns Unique tracking ID for this action
   */
  startAction(actionType: string, actionLabel?: string, parentId?: string): string;
  
  /**
   * End tracking an action
   * @param trackingId The tracking ID returned from startAction
   * @param error Optional error information if the action failed
   */
  endAction(trackingId: string, error?: string): void;
  
  /**
   * Get all currently tracked actions
   * @returns Array of action tracking data
   */
  getAllActions(): ActionTrackingData[];
  
  /**
   * Get actions filtered by criteria
   * @param filter Filter criteria
   * @returns Filtered array of action tracking data
   */
  getFilteredActions(filter: {
    actionType?: string;
    status?: 'running' | 'completed' | 'error';
    minDuration?: number;
    maxDuration?: number;
    since?: number; // timestamp
  }): ActionTrackingData[];
  
  /**
   * Clear all tracking data
   */
  clear(): void;
  
  /**
   * Subscribe to tracking data changes
   * @param callback Function to call when tracking data changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (actions: ActionTrackingData[]) => void): () => void;
  
  /**
   * Get the current active action ID (for parent-child relationships)
   */
  getCurrentActionId(): string | undefined;
}
