import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  MiroirLogService,
} from "../../src/3_controllers/MiroirLogService";
import { LogInterceptor } from '../../src/4_services/LogInterceptor';
// import { TestLogService } from '../../src/3_controllers/TestLogService';
import { MiroirActionOrTestTracker } from '../../src/3_controllers/MiroirActionOrTestTracker';
// import { TestTracker } from '../../src/3_controllers/TestTracker';

// Integration test without mocks - testing real interactions between components
describe('LogInterceptor Integration Tests', () => {
  let logInterceptor: LogInterceptor;
  let runActionOrTestTracker: MiroirActionOrTestTracker;
  let actionOrTestLogService: MiroirLogService;
  // let testTracker: MiroirActionOrTestTracker;
  // let testLogService: MiroirLogService;
  let originalConsole: typeof console;
  let capturedLogs: string[] = [];

  beforeEach(() => {
    // Store original console
    originalConsole = { ...console };
    
    // Capture console output for verification
    capturedLogs = [];
    const captureLog = (level: string) => (...args: any[]) => {
      capturedLogs.push(`${level}: ${args.join(' ')}`);
      // Still call original to maintain normal behavior
      const originalMethod = originalConsole[level as keyof typeof originalConsole] as any;
      if (typeof originalMethod === 'function') {
        originalMethod(...args);
      }
    };

    console.trace = captureLog('trace') as any;
    console.debug = captureLog('debug') as any;
    console.log = captureLog('log') as any;
    console.info = captureLog('info') as any;
    console.warn = captureLog('warn') as any;
    console.error = captureLog('error') as any;

    // Create real instances (no mocks)
    runActionOrTestTracker = new MiroirActionOrTestTracker();
    actionOrTestLogService = new MiroirLogService(runActionOrTestTracker);
    // testTracker = new TestTracker();
    // testLogService = new TestLogService(testTracker);
    // testTracker = runActionOrTestTracker;
    // testLogService = new TestLogServiceCompatibilityWrapper(actionOrTestLogService);

    // Create LogInterceptor with both action and test configurations
    logInterceptor = new LogInterceptor({
      actionOrTest: {
        actionOrTestLogService: actionOrTestLogService,
        actionOrTestTracker: runActionOrTestTracker
      },
      // test: {
      //   testLogService: testLogService,
      //   testTracker: runActionOrTestTracker,
      //   // testLogService,
      //   // testTracker
      // }
    });
  });

  afterEach(() => {
    logInterceptor.destroy();
    // Restore original console
    Object.assign(console, originalConsole);
  });

  it('should capture logs during action execution', () => {
    logInterceptor.start();

    // Start an action
    const actionId = runActionOrTestTracker.startAction('testAction');
    
    // Emit some logs
    console.info('[2024-01-01T10:00:00Z] info (TestLogger) - Test action message');
    console.warn('[2024-01-01T10:00:01Z] warn (ActionLogger) - Warning during action');
    
    // Stop the action
    runActionOrTestTracker.endAction(actionId);

    // Verify logs were captured for the action
    const actionLogs = actionOrTestLogService.getActionOrTestLogs(actionId);
    expect(actionLogs).toBeDefined();
    expect(actionLogs?.logs).toHaveLength(2);
    expect(actionLogs?.logs[0]).toMatchObject({
      level: 'info',
      loggerName: 'TestLogger',
      message: '[2024-01-01T10:00:00Z] info (TestLogger) - Test action message'
    });
    expect(actionLogs?.logs[1]).toMatchObject({
      level: 'warn',
      loggerName: 'ActionLogger',
      message: '[2024-01-01T10:00:01Z] warn (ActionLogger) - Warning during action'
    });

    // Verify console output still happened
    expect(capturedLogs).toContain('info: [2024-01-01T10:00:00Z] info (TestLogger) - Test action message');
    expect(capturedLogs).toContain('warn: [2024-01-01T10:00:01Z] warn (ActionLogger) - Warning during action');
  });

  it('should capture logs during test execution', () => {
    logInterceptor.start();

    // Start a test suite and test
    runActionOrTestTracker.setTestSuite('Integration Tests');
    runActionOrTestTracker.setTest('should capture logs');
    
    // Emit some logs
    console.error('[2024-01-01T10:00:00Z] error (TestRunner) - Test error message');
    console.debug('[2024-01-01T10:00:01Z] debug (AssertionHelper) - Debug during test');
    
    // Complete the test
    // testTracker.setTestAssertions([{ description: 'test assertion', result: 'success' }]);

    // Verify logs were captured for the test
    // const testLogs = actionOrTestLogService.getTestLogs('Integration Tests', 'should capture logs');
    const testLogs = actionOrTestLogService.getActionOrTestLogs('Integration Tests');
    expect(testLogs).toHaveLength(1); // One TestLogs object for this test context
    // expect(testLogs[0].logs).toHaveLength(2);
    // expect(testLogs[0].logs[0]).toMatchObject({
    //   level: 'error',
    //   loggerName: 'TestRunner',
    //   message: '[2024-01-01T10:00:00Z] error (TestRunner) - Test error message'
    // });
    // expect(testLogs[0].logs[1]).toMatchObject({
    //   level: 'debug',
    //   loggerName: 'AssertionHelper',
    //   message: '[2024-01-01T10:00:01Z] debug (AssertionHelper) - Debug during test'
    // });

    // Verify console output still happened
    expect(capturedLogs).toContain('error: [2024-01-01T10:00:00Z] error (TestRunner) - Test error message');
    expect(capturedLogs).toContain('debug: [2024-01-01T10:00:01Z] debug (AssertionHelper) - Debug during test');
  });

  it('should capture logs for both action and test when both are active', () => {
    logInterceptor.start();

    // Start an action
    const actionId = runActionOrTestTracker.startAction('testAction');
    
    // Start a test within the action
    runActionOrTestTracker.setTestSuite('Action Test Suite');
    runActionOrTestTracker.setTest('action test');
    
    // Emit a log that should be captured by both
    console.info('[2024-01-01T10:00:00Z] info (DualLogger) - Message in both contexts');
    
    // End both contexts
    runActionOrTestTracker.endAction(actionId);

    // Verify log was captured by both services
    const actionLogs = actionOrTestLogService.getActionOrTestLogs(actionId);
    // const testLogs = actionOrTestLogService.getActionOrTestLogs('Action Test Suite', 'action test');
    
    expect(actionLogs?.logs).toHaveLength(1);
    // expect(testLogs).toHaveLength(1);
    // expect(testLogs[0].logs).toHaveLength(1);
    
    // Both should have the same log entry
    expect(actionLogs?.logs[0]).toMatchObject({
      level: 'info',
      loggerName: 'DualLogger',
      message: '[2024-01-01T10:00:00Z] info (DualLogger) - Message in both contexts'
    });
    // expect(testLogs[0].logs[0]).toMatchObject({
    //   level: 'info',
    //   loggerName: 'DualLogger',
    //   message: '[2024-01-01T10:00:00Z] info (DualLogger) - Message in both contexts'
    // });
  });

  it('should not capture logs when no action or test is active', () => {
    logInterceptor.start();

    // Emit logs without any active context
    console.info('[2024-01-01T10:00:00Z] info (StandaloneLogger) - Standalone message');
    console.warn('[2024-01-01T10:00:01Z] warn (StandaloneLogger) - Standalone warning');

    // Verify logs were not captured (no active contexts)
    // Since no action or test was started, logs should not be captured
    const allActionLogs = actionOrTestLogService.getAllActionOrTestLogs().filter(log => log.trackingType === 'action');
    const allTestLogs = actionOrTestLogService.getAllActionOrTestLogs().filter(log => log.trackingType === 'test');
    
    expect(allActionLogs).toHaveLength(0);
    expect(allTestLogs).toHaveLength(0);

    // But console output should still happen
    expect(capturedLogs).toContain('info: [2024-01-01T10:00:00Z] info (StandaloneLogger) - Standalone message');
    expect(capturedLogs).toContain('warn: [2024-01-01T10:00:01Z] warn (StandaloneLogger) - Standalone warning');
  });

  it('should handle action-only configuration', () => {
    // Create a fresh interceptor with only action configuration
    const freshActionTracker = new MiroirActionOrTestTracker();
    const freshActionLogService = new MiroirLogService(freshActionTracker);
    
    // Create LogInterceptor with only action configuration
    const actionOnlyInterceptor = new LogInterceptor({
      actionOrTest: {
        actionOrTestLogService: freshActionLogService,
        actionOrTestTracker: freshActionTracker
      }
      // Note: no test configuration provided
    });

    actionOnlyInterceptor.start();

    // Start an action
    const actionId = freshActionTracker.startAction('actionOnlyTest');
    
    // Emit logs
    console.info('[2024-01-01T10:00:00Z] info (ActionOnlyLogger) - Action-only message');
    
    // End action
    freshActionTracker.endAction(actionId);

    // Verify action logs were captured
    const actionLogs = freshActionLogService.getActionOrTestLogs(actionId);
    expect(actionLogs?.logs).toHaveLength(1);
    expect(actionLogs?.logs[0]).toMatchObject({
      level: 'info',
      loggerName: 'ActionOnlyLogger',
      message: '[2024-01-01T10:00:00Z] info (ActionOnlyLogger) - Action-only message'
    });
    
    actionOnlyInterceptor.destroy();
  });

  // it('should handle test-only configuration', () => {
  //   // Create a fresh interceptor with only test configuration
  //   const freshTestTracker = new TestTracker();
  //   const freshTestLogService = new TestLogService(freshTestTracker);
    
  //   // Create LogInterceptor with only test configuration
  //   const testOnlyInterceptor = new LogInterceptor({
  //     test: {
  //       testLogService: freshTestLogService,
  //       testTracker: freshTestTracker
  //     }
  //     // Note: no action configuration provided
  //   });

  //   testOnlyInterceptor.start();

  //   // Start a test
  //   freshTestTracker.setTestSuite('Test Only Suite');
  //   freshTestTracker.setTest('test only test');
    
  //   // Emit logs
  //   console.info('[2024-01-01T10:00:00Z] info (TestOnlyLogger) - Test-only message');

  //   // Verify test logs were captured
  //   const testLogs = freshTestLogService.getTestLogs('Test Only Suite', 'test only test');
  //   expect(testLogs).toHaveLength(1);
  //   expect(testLogs[0].logs).toHaveLength(1);
  //   expect(testLogs[0].logs[0]).toMatchObject({
  //     level: 'info',
  //     loggerName: 'TestOnlyLogger',
  //     message: '[2024-01-01T10:00:00Z] info (TestOnlyLogger) - Test-only message'
  //   });

  //   testOnlyInterceptor.destroy();
  // });

  it('should properly stop and restore console methods', () => {
    const originalMethods = {
      trace: console.trace,
      debug: console.debug,
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    logInterceptor.start();
    
    // Verify console methods were replaced
    expect(console.trace).not.toBe(originalMethods.trace);
    expect(console.debug).not.toBe(originalMethods.debug);
    expect(console.log).not.toBe(originalMethods.log);
    expect(console.info).not.toBe(originalMethods.info);
    expect(console.warn).not.toBe(originalMethods.warn);
    expect(console.error).not.toBe(originalMethods.error);

    logInterceptor.stop();
    
    // Verify console methods were restored
    // Note: We can't compare function equality directly due to binding,
    // but we can verify they work and don't intercept anymore
    const actionId = runActionOrTestTracker.startAction('postStopAction');
    console.info('[2024-01-01T10:00:00Z] info (PostStopLogger) - Post-stop message');
    runActionOrTestTracker.endAction(actionId);

    // Verify no logs were captured after stopping
    const actionLogs = actionOrTestLogService.getActionOrTestLogs(actionId);
    expect(actionLogs?.logs).toHaveLength(0);
  });

  // it('should work with logger wrappers', () => {
  //   logInterceptor.start();

  //   // Create action-aware logger wrapper
  //   const actionWrapper = new ActionAwareLoggerWrapper(actionOrTestLogService, runActionOrTestTracker);
    
  //   // Create test-aware logger wrapper
  //   const testWrapper = new TestAwareLoggerWrapper(testLogService, testTracker);

  //   // Mock logger that will be wrapped
  //   const mockLogger = {
  //     info: (message: string) => console.info(`WRAPPED: ${message}`),
  //     warn: (message: string) => console.warn(`WRAPPED: ${message}`)
  //   };

  //   // Wrap the logger
  //   const actionWrappedLogger = actionWrapper.wrapLogger(mockLogger, 'ActionWrappedLogger');
  //   const testWrappedLogger = testWrapper.wrapLogger(mockLogger, 'TestWrappedLogger');

  //   // Start contexts
  //   const actionId = runActionOrTestTracker.startAction('wrapperTest');
  //   runActionOrTestTracker.setTestSuite('Wrapper Suite');
  //   runActionOrTestTracker.setTest('wrapper test');

  //   // Use wrapped loggers
  //   actionWrappedLogger.info('[2024-01-01T10:00:00Z] info (ActionWrappedLogger) - Action wrapped message');
  //   testWrappedLogger.warn('[2024-01-01T10:00:01Z] warn (TestWrappedLogger) - Test wrapped message');

  //   // End contexts
  //   runActionOrTestTracker.endAction(actionId);

  //   // Verify both direct console interception and wrapper interception worked
  //   const actionLogs = actionOrTestLogService.getActionOrTestLogs(actionId);
  //   const testLogs = testLogService.getTestLogs('Wrapper Suite', 'wrapper test');

  //   // Should have logs from both console interception and wrapper
  //   expect(actionLogs?.logs.length).toBeGreaterThan(0);
  //   expect(testLogs.length).toBeGreaterThan(0);
  //   expect(testLogs[0].logs.length).toBeGreaterThan(0);

  //   // Find the wrapper-specific logs
  //   const actionWrapperLog = actionLogs?.logs.find(log => log.loggerName === 'ActionWrappedLogger');
  //   const testWrapperLog = testLogs[0].logs.find(log => log.loggerName === 'TestWrappedLogger');

  //   expect(actionWrapperLog).toBeDefined();
  //   expect(testWrapperLog).toBeDefined();
  // });
});
