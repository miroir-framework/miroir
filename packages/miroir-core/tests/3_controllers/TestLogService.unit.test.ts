import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestLogService } from '../../src/3_controllers/TestLogService';
import { TestTracker } from '../../src/3_controllers/TestTracker';
import { TestTrackerInterface } from '../../src/0_interfaces/3_controllers/TestTrackerInterface';

// Mock LoggerGlobalContext since TestLogService uses it for action context
vi.mock('../../src/4_services/LoggerContext', () => ({
  LoggerGlobalContext: {
    getAction: vi.fn(() => 'mockAction'),
    getCompositeAction: vi.fn(() => 'mockCompositeAction'),
  }
}));

describe('TestLogService', () => {
  let testLogService: TestLogService;
  let testTracker: TestTrackerInterface;

  beforeEach(() => {
    testTracker = new TestTracker();
    testLogService = new TestLogService(testTracker);
  });

  afterEach(() => {
    // Clean up the TestLogService to prevent test pollution
    testLogService.destroy();
    testLogService.clear();
  });

  describe('Context tracking from TestTracker', () => {
    it('should get test context from TestTracker and action context from LoggerGlobalContext', () => {
      // Set test context in TestTracker
      testTracker.setTestSuite('testSuite1');
      testTracker.setTest('test1');
      testTracker.setTestAssertion('assertion1');
      
      // Log a message
      testLogService.logForCurrentTest('info', 'testLogger', 'Test message');
      
      // Get the test logs
      const testLogs = testLogService.getTestLogs('testSuite1', 'test1', 'assertion1');
      
      expect(testLogs).toHaveLength(1);
      
      const logEntry = testLogs[0].logs[0];
      expect(logEntry.context).toBeDefined();
      expect(logEntry.context!.testSuite).toBe('testSuite1');
      expect(logEntry.context!.test).toBe('test1');
      expect(logEntry.context!.testAssertion).toBe('assertion1');
      expect(logEntry.context!.action).toBe('mockAction');
      expect(logEntry.context!.compositeAction).toBe('mockCompositeAction');
    });

    it('should handle undefined test and action contexts', () => {
      // Log a message without setting test context
      testLogService.logForCurrentTest('info', 'testLogger', 'Test message');
      
      // Get all test logs
      const allLogs = testLogService.getAllTestLogs();
      
      // Should NOT create logs when no test context is set (similar to ActionLogService behavior)
      expect(allLogs).toHaveLength(0);
    });

    it('should update context when TestTracker context changes', () => {
      // Set initial test context
      testTracker.setTest('test1');
      testTracker.setTestAssertion('assertion1');
      
      // Log first message
      testLogService.logForCurrentTest('info', 'testLogger', 'First message');
      
      // Change test context
      testTracker.setTest('test2');
      testTracker.setTestAssertion('assertion2');
      
      // Log second message
      testLogService.logForCurrentTest('info', 'testLogger', 'Second message');
      
      // Verify logs are stored under correct test labels
      const test1Logs = testLogService.getTestLogs(undefined, 'test1', 'assertion1');
      const test2Logs = testLogService.getTestLogs(undefined, 'test2', 'assertion2');
      
      expect(test1Logs).toHaveLength(1);
      expect(test1Logs[0].logs[0].context!.test).toBe('test1');
      expect(test1Logs[0].logs[0].context!.testAssertion).toBe('assertion1');
      
      expect(test2Logs).toHaveLength(1);
      expect(test2Logs[0].logs[0].context!.test).toBe('test2');
      expect(test2Logs[0].logs[0].context!.testAssertion).toBe('assertion2');
    });
  });

  describe('Test log management', () => {
    it('should store multiple log entries for the same test', () => {
      testTracker.setTest('test1');
      
      testLogService.logForCurrentTest('info', 'logger1', 'First message');
      testLogService.logForCurrentTest('error', 'logger2', 'Second message');
      testLogService.logForCurrentTest('warn', 'logger3', 'Third message');
      
      const testLogs = testLogService.getTestLogs(undefined, 'test1');
      expect(testLogs).toHaveLength(1);
      expect(testLogs[0].logs).toHaveLength(3);
      
      expect(testLogs[0].logs[0].message).toBe('First message');
      expect(testLogs[0].logs[0].level).toBe('info');
      expect(testLogs[0].logs[0].loggerName).toBe('logger1');
      
      expect(testLogs[0].logs[1].message).toBe('Second message');
      expect(testLogs[0].logs[1].level).toBe('error');
      expect(testLogs[0].logs[1].loggerName).toBe('logger2');
      
      expect(testLogs[0].logs[2].message).toBe('Third message');
      expect(testLogs[0].logs[2].level).toBe('warn');
      expect(testLogs[0].logs[2].loggerName).toBe('logger3');
    });

    it('should store logs for different tests separately', () => {
      // Log for first test
      testTracker.setTest('test1');
      testLogService.logForCurrentTest('info', 'logger1', 'Test 1 message');
      
      // Log for second test
      testTracker.setTest('test2');
      testLogService.logForCurrentTest('error', 'logger2', 'Test 2 message');
      
      // Verify logs are stored separately
      const test1Logs = testLogService.getTestLogs(undefined, 'test1');
      const test2Logs = testLogService.getTestLogs(undefined, 'test2');
      
      expect(test1Logs).toHaveLength(1);
      expect(test1Logs[0].logs[0].message).toBe('Test 1 message');
      expect(test1Logs[0].logs[0].level).toBe('info');
      
      expect(test2Logs).toHaveLength(1);
      expect(test2Logs[0].logs[0].message).toBe('Test 2 message');
      expect(test2Logs[0].logs[0].level).toBe('error');
    });

    it('should return empty array for non-existent test logs', () => {
      const nonExistentLogs = testLogService.getTestLogs('nonExistentSuite', 'nonExistentTest');
      expect(nonExistentLogs).toHaveLength(0);
    });

    it('should return all test logs across all tests', () => {
      // Log for multiple tests
      testTracker.setTest('test1');
      testLogService.logForCurrentTest('info', 'logger1', 'Test 1 message');
      
      testTracker.setTest('test2');
      testLogService.logForCurrentTest('error', 'logger2', 'Test 2 message');
      
      testTracker.setTest('test3');
      testLogService.logForCurrentTest('warn', 'logger3', 'Test 3 message');
      
      const allLogs = testLogService.getAllTestLogs();
      expect(allLogs).toHaveLength(3);
      
      // Find logs by test label
      const test1Log = allLogs.find(log => log.test === 'test1');
      const test2Log = allLogs.find(log => log.test === 'test2');
      const test3Log = allLogs.find(log => log.test === 'test3');
      
      expect(test1Log).toBeDefined();
      expect(test1Log!.logs).toHaveLength(1);
      expect(test1Log!.logs[0].message).toBe('Test 1 message');
      
      expect(test2Log).toBeDefined();
      expect(test2Log!.logs).toHaveLength(1);
      expect(test2Log!.logs[0].message).toBe('Test 2 message');
      
      expect(test3Log).toBeDefined();
      expect(test3Log!.logs).toHaveLength(1);
      expect(test3Log!.logs[0].message).toBe('Test 3 message');
    });
  });

  describe('Log filtering', () => {
    beforeEach(() => {
      // Clear any existing logs first
      testLogService.clear();
      
      // Set up test context and log multiple entries
      testTracker.setTestSuite('testSuite1');
      testTracker.setTest('test1');
      testTracker.setTestAssertion('assertion1');
      
      testLogService.logForCurrentTest('info', 'logger1', 'Info message');
      testLogService.logForCurrentTest('error', 'logger2', 'Error message');
      testLogService.logForCurrentTest('warn', 'logger1', 'Warning message');
      testLogService.logForCurrentTest('info', 'logger3', 'Another info message');
    });

    it('should filter logs by multiple criteria', () => {
      const filteredLogs = testLogService.getFilteredTestLogs({ 
        level: 'info',
        loggerName: 'logger1'
      });
      
      expect(filteredLogs).toHaveLength(1);
      expect(filteredLogs[0].logs).toHaveLength(1);
      expect(filteredLogs[0].logs[0].level).toBe('info');
      expect(filteredLogs[0].logs[0].loggerName).toBe('logger1');
      expect(filteredLogs[0].logs[0].message).toBe('Info message');
    });

    it('should filter logs by test suite', () => {
      const testSuiteLogs = testLogService.getFilteredTestLogs({ testSuite: 'testSuite1' });
      expect(testSuiteLogs).toHaveLength(1);
      expect(testSuiteLogs[0].logs).toHaveLength(4); // All logs should match
      
      const nonMatchingLogs = testLogService.getFilteredTestLogs({ testSuite: 'nonExistentSuite' });
      expect(nonMatchingLogs).toHaveLength(0);
    });

    it('should filter logs by search text', () => {
      const searchLogs = testLogService.getFilteredTestLogs({ searchText: 'Error' });
      expect(searchLogs).toHaveLength(1);
      expect(searchLogs[0].logs).toHaveLength(1);
      expect(searchLogs[0].logs[0].message).toBe('Error message');
    });
  });
});
