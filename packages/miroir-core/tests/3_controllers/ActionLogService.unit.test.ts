import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MiroirEventService } from '../../src/3_controllers/MiroirEventService';
import { MiroirEventTracker } from '../../src/3_controllers/MiroirEventTracker';
import { MiroirEventTrackerInterface } from '../../src/0_interfaces/3_controllers/MiroirEventTrackerInterface';

// Mock LoggerGlobalContext to avoid dependencies
vi.mock('../../src/4_services/LoggerContext', () => ({
  LoggerGlobalContext: {
    getTestSuite: () => 'mockTestSuite',
    getTest: () => 'mockTest',
    getTestAssertion: () => 'mockTestAssertion',
    getCompositeAction: () => 'shouldNotBeUsed', // This should not be called anymore
    getAction: () => 'shouldNotBeUsed', // This should not be called anymore
  }
}));

describe('MiroirEventService', () => {
  let actionLogService: MiroirEventService;
  let runActionTracker: MiroirEventTrackerInterface;

  beforeEach(() => {
    runActionTracker = new MiroirEventTracker();
    actionLogService = new MiroirEventService(runActionTracker);
  });

  describe('Context tracking from MiroirEventTracker', () => {
    it('should get action and compositeAction context from MiroirEventTracker, not LoggerGlobalContext', () => {
      // Start an action in the tracker
      const actionId = runActionTracker.startEvent('testAction', 'Test Action Label');
      
      // Set action context in MiroirEventTracker
      runActionTracker.setAction('contextAction');
      runActionTracker.setCompositeAction('contextCompositeAction');
      
      // Log a message
      actionLogService.logForCurrentActionOrTest('info', 'testLogger', 'Test message');
      
      // Get the action logs
      const actionLogs = actionLogService.getEvent(actionId);
      
      expect(actionLogs).toBeDefined();
      expect(actionLogs!.logs).toHaveLength(1);
      
      const logEntry = actionLogs!.logs[0];
      expect(logEntry.context).toBeDefined();
      expect(logEntry.context!.action).toBe('contextAction');
      expect(logEntry.context!.compositeAction).toBe('contextCompositeAction');
      
      // Verify test context still comes from LoggerGlobalContext
      expect(logEntry.context!.testSuite).toBe('mockTestSuite');
      expect(logEntry.context!.test).toBe('mockTest');
      expect(logEntry.context!.testAssertion).toBe('mockTestAssertion');
    });

    it('should handle undefined action and compositeAction context', () => {
      // Start an action in the tracker without setting context
      const actionId = runActionTracker.startEvent('testAction', 'Test Action Label');
      
      // Log a message
      actionLogService.logForCurrentActionOrTest('info', 'testLogger', 'Test message');
      
      // Get the action logs
      const actionLogs = actionLogService.getEvent(actionId);
      
      expect(actionLogs).toBeDefined();
      expect(actionLogs!.logs).toHaveLength(1);
      
      const logEntry = actionLogs!.logs[0];
      expect(logEntry.context).toBeDefined();
      expect(logEntry.context!.action).toBeUndefined();
      expect(logEntry.context!.compositeAction).toBeUndefined();
    });

    it('should update context when MiroirEventTracker context changes', () => {
      // Start an action in the tracker
      const actionId = runActionTracker.startEvent('testAction', 'Test Action Label');
      
      // Set initial context
      runActionTracker.setAction('initialAction');
      runActionTracker.setCompositeAction('initialCompositeAction');
      
      // Log first message
      actionLogService.logForCurrentActionOrTest('info', 'testLogger', 'First message');
      
      // Change context
      runActionTracker.setAction('updatedAction');
      runActionTracker.setCompositeAction('updatedCompositeAction');
      
      // Log second message
      actionLogService.logForCurrentActionOrTest('info', 'testLogger', 'Second message');
      
      // Verify both log entries have correct context
      const actionLogs = actionLogService.getEvent(actionId);
      expect(actionLogs!.logs).toHaveLength(2);
      
      const firstLog = actionLogs!.logs[0];
      expect(firstLog.context!.action).toBe('initialAction');
      expect(firstLog.context!.compositeAction).toBe('initialCompositeAction');
      
      const secondLog = actionLogs!.logs[1];
      expect(secondLog.context!.action).toBe('updatedAction');
      expect(secondLog.context!.compositeAction).toBe('updatedCompositeAction');
    });

    it('should not log when no current action is set in MiroirEventTracker', () => {
      // Don't start any action
      
      // Try to log a message
      actionLogService.logForCurrentActionOrTest('info', 'testLogger', 'Test message');
      
      // Verify no logs were created
      const allLogs = actionLogService.getAllActionOrTestLogs();
      expect(allLogs).toHaveLength(0);
    });
  });
});
