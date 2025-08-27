import { RunActionTrackerInterface, ActionTrackingData } from "../0_interfaces/3_controllers/RunActionTrackerInterface";

export class RunActionTracker implements RunActionTrackerInterface {
  private actions: Map<string, ActionTrackingData> = new Map();
  private subscribers: Set<(actions: ActionTrackingData[]) => void> = new Set();
  private currentActionStack: string[] = []; // Stack to track nested actions
  private cleanupInterval: NodeJS.Timeout;
  private readonly CLEANUP_INTERVAL_MS = 60000; // 1 minute
  private readonly MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Start auto-cleanup timer
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  startAction(actionType: string, actionLabel?: string, parentId?: string): string {
    const id = this.generateId();
    const now = Date.now();
    
    // If no parentId is provided, use the current active action as parent
    const effectiveParentId = parentId || this.getCurrentActionId();
    
    const depth = effectiveParentId ? 
      (this.actions.get(effectiveParentId)?.depth ?? 0) + 1 : 0;

    const actionData: ActionTrackingData = {
      id,
      parentId: effectiveParentId,
      actionType,
      actionLabel,
      startTime: now,
      status: 'running',
      depth,
      children: []
    };

    this.actions.set(id, actionData);
    
    // Add to parent's children if there's a parent
    if (effectiveParentId) {
      const parent = this.actions.get(effectiveParentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }
    
    // Push to action stack
    this.currentActionStack.push(id);
    
    this.notifySubscribers();
    return id;
  }

  endAction(trackingId: string, error?: string): void {
    const action = this.actions.get(trackingId);
    if (!action) {
      return;
    }

    const now = Date.now();
    action.endTime = now;
    action.duration = now - action.startTime;
    action.status = error ? 'error' : 'completed';
    if (error) {
      action.error = error;
    }

    // Remove from action stack
    const index = this.currentActionStack.indexOf(trackingId);
    if (index !== -1) {
      this.currentActionStack.splice(index, 1);
    }

    this.notifySubscribers();
  }

  getAllActions(): ActionTrackingData[] {
    return Array.from(this.actions.values()).sort((a, b) => a.startTime - b.startTime);
  }

  getFilteredActions(filter: {
    actionType?: string;
    status?: 'running' | 'completed' | 'error';
    minDuration?: number;
    maxDuration?: number;
    since?: number;
  }): ActionTrackingData[] {
    return this.getAllActions().filter(action => {
      if (filter.actionType && action.actionType !== filter.actionType) {
        return false;
      }
      if (filter.status && action.status !== filter.status) {
        return false;
      }
      if (filter.minDuration && (action.duration === undefined || action.duration < filter.minDuration)) {
        return false;
      }
      if (filter.maxDuration && (action.duration === undefined || action.duration > filter.maxDuration)) {
        return false;
      }
      if (filter.since && action.startTime < filter.since) {
        return false;
      }
      return true;
    });
  }

  clear(): void {
    this.actions.clear();
    this.currentActionStack = [];
    this.notifySubscribers();
  }

  subscribe(callback: (actions: ActionTrackingData[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getCurrentActionId(): string | undefined {
    return this.currentActionStack[this.currentActionStack.length - 1];
  }

  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifySubscribers(): void {
    const actions = this.getAllActions();
    this.subscribers.forEach(callback => {
      try {
        callback(actions);
      } catch (error) {
        console.error('Error in RunActionTracker subscriber:', error);
      }
    });
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.MAX_AGE_MS;
    
    // Find actions to remove (completed/error actions older than MAX_AGE_MS)
    const toRemove: string[] = [];
    
    for (const [id, action] of this.actions.entries()) {
      if (action.status !== 'running' && action.startTime < cutoff) {
        toRemove.push(id);
      }
    }
    
    // Remove old actions and update parent references
    toRemove.forEach(id => {
      const action = this.actions.get(id);
      if (action?.parentId) {
        const parent = this.actions.get(action.parentId);
        if (parent) {
          const index = parent.children.indexOf(id);
          if (index !== -1) {
            parent.children.splice(index, 1);
          }
        }
      }
      this.actions.delete(id);
    });
    
    if (toRemove.length > 0) {
      this.notifySubscribers();
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.subscribers.clear();
  }
}
