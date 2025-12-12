import { describe, it, expect, beforeEach } from 'vitest';
import { MiroirActivityTracker } from '../../src/3_controllers/MiroirActivityTracker';
import { MiroirActivityTrackerInterface } from '../../src/0_interfaces/3_controllers/MiroirActivityTrackerInterface';

describe('MiroirActivityTracker', () => {
  let tracker: MiroirActivityTrackerInterface;

  beforeEach(() => {
    tracker = new MiroirActivityTracker();
  });

  describe('Action and CompositeActionSequence context tracking', () => {
    it('should start with undefined action and compositeActionSequence', () => {
      expect(tracker.getAction()).toBeUndefined();
      expect(tracker.getCompositeAction()).toBeUndefined();
    });

    it('should set and get action context', () => {
      const actionName = 'testAction';
      tracker.setAction(actionName);
      expect(tracker.getAction()).toBe(actionName);
    });

    it('should set and get compositeActionSequence context', () => {
      const compositeActionName = 'testCompositeAction';
      tracker.setCompositeAction(compositeActionName);
      expect(tracker.getCompositeAction()).toBe(compositeActionName);
    });

    it('should allow clearing action context', () => {
      tracker.setAction('testAction');
      expect(tracker.getAction()).toBe('testAction');
      
      tracker.setAction(undefined);
      expect(tracker.getAction()).toBeUndefined();
    });

    it('should allow clearing compositeActionSequence context', () => {
      tracker.setCompositeAction('testCompositeAction');
      expect(tracker.getCompositeAction()).toBe('testCompositeAction');
      
      tracker.setCompositeAction(undefined);
      expect(tracker.getCompositeAction()).toBeUndefined();
    });

    it('should maintain independent action and compositeActionSequence contexts', () => {
      tracker.setAction('testAction');
      tracker.setCompositeAction('testCompositeAction');
      
      expect(tracker.getAction()).toBe('testAction');
      expect(tracker.getCompositeAction()).toBe('testCompositeAction');
      
      tracker.setAction(undefined);
      expect(tracker.getAction()).toBeUndefined();
      expect(tracker.getCompositeAction()).toBe('testCompositeAction');
    });

    it('should clear action and compositeActionSequence contexts when clearing all data', () => {
      tracker.setAction('testAction');
      tracker.setCompositeAction('testCompositeAction');
      
      tracker.clear();
      
      expect(tracker.getAction()).toBeUndefined();
      expect(tracker.getCompositeAction()).toBeUndefined();
    });
  });

  describe('Integration with existing action tracking', () => {
    it('should maintain action context alongside action tracking', () => {
      // Start tracking an action
      const eventId = tracker.startActivity_Action('testActionType', 'testActionLabel');
      
      // Set action context
      tracker.setAction('contextAction');
      tracker.setCompositeAction('contextCompositeAction');
      
      // Verify both work
      expect(tracker.getCurrentActivityId()).toBe(eventId);
      expect(tracker.getAction()).toBe('contextAction');
      expect(tracker.getCompositeAction()).toBe('contextCompositeAction');
      
      // End action tracking
      tracker.endActivity(eventId);
      
      // Action context should still be available
      expect(tracker.getAction()).toBe('contextAction');
      expect(tracker.getCompositeAction()).toBe('contextCompositeAction');
    });
  });
});
