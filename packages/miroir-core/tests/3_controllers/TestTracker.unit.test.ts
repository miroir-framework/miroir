import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MiroirEventTrackerInterface } from '../../src/0_interfaces/3_controllers/MiroirEventTrackerInterface';
import { MiroirEventTracker } from '../../src/3_controllers/MiroirEventTracker';
import type { TestAssertionResult } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';
import { assert } from 'console';
// import { TestTracker } from '../../src/3_controllers/';
// import { TestTrackerInterface } from '../../src/0_interfaces/3_controllers/TestTrackerInterface';
// import { TestAssertionResult } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';

describe('TestTracker', () => {
  let tracker: MiroirEventTrackerInterface;

  beforeEach(() => {
    tracker = new MiroirEventTracker();
  });

  describe('TestSuite context tracking', () => {
    it('should start with undefined testSuite', () => {
      expect(tracker.getTestSuite()).toBeUndefined();
    });

    it('should set and get testSuite context', () => {
      const testSuiteName = 'testSuite1';
      tracker.setTestSuite(testSuiteName);
      expect(tracker.getTestSuite()).toBe(testSuiteName);
    });

    it('should allow clearing testSuite context', () => {
      tracker.setTestSuite('testSuite1');
      expect(tracker.getTestSuite()).toBe('testSuite1');
      
      tracker.setTestSuite(undefined);
      expect(tracker.getTestSuite()).toBeUndefined();
    });
  });

  describe('Test context tracking', () => {
    it('should start with undefined test', () => {
      expect(tracker.getTest()).toBeUndefined();
    });

    it('should set and get test context', () => {
      const testName = 'test1';
      tracker.setTest(testName);
      expect(tracker.getTest()).toBe(testName);
    });

    it('should allow clearing test context', () => {
      tracker.setTest('test1');
      expect(tracker.getTest()).toBe('test1');
      
      tracker.setTest(undefined);
      expect(tracker.getTest()).toBeUndefined();
    });
  });

  describe('TestAssertion context tracking', () => {
    it('should start with undefined testAssertion', () => {
      expect(tracker.getTestAssertion()).toBeUndefined();
    });

    it('should set and get testAssertion context', () => {
      const testAssertionName = 'assertion1';
      tracker.setTestAssertion(testAssertionName);
      expect(tracker.getTestAssertion()).toBe(testAssertionName);
    });

    it('should allow clearing testAssertion context', () => {
      tracker.setTestAssertion('assertion1');
      expect(tracker.getTestAssertion()).toBe('assertion1');
      
      tracker.setTestAssertion(undefined);
      expect(tracker.getTestAssertion()).toBeUndefined();
    });
  });

  describe('Independent context management', () => {
    it('should maintain independent testSuite, test, and testAssertion contexts', () => {
      tracker.setTestSuite('testSuite1');
      tracker.setTest('test1');
      tracker.setTestAssertion('assertion1');
      
      expect(tracker.getTestSuite()).toBe('testSuite1');
      expect(tracker.getTest()).toBe('test1');
      expect(tracker.getTestAssertion()).toBe('assertion1');
      
      tracker.setTest(undefined);
      expect(tracker.getTestSuite()).toBe('testSuite1');
      expect(tracker.getTest()).toBeUndefined();
      expect(tracker.getTestAssertion()).toBe('assertion1');
    });

    it('should clear all contexts when clearing all data', () => {
      tracker.setTestSuite('testSuite1');
      tracker.setTest('test1');
      tracker.setTestAssertion('assertion1');
      
      tracker.clear();
      
      expect(tracker.getTestSuite()).toBeUndefined();
      expect(tracker.getTest()).toBeUndefined();
      expect(tracker.getTestAssertion()).toBeUndefined();
    });
  });

  describe('TestAssertion result tracking', () => {
    it('should store test assertion results', () => {
      // Set context first
      tracker.setTestSuite('testSuite1');
      tracker.setTest('test1');
      
      const testResult: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok'
      };

      tracker.setTestAssertionResult([{ testSuite: "testSuite1"}, {test: "test1"}, { testAssertion: "assertion1"}], testResult);
      
      // Verify it can be retrieved through getTestAssertionsResults
      const storedResults = tracker.getTestAssertionsResults([{ testSuite: "testSuite1"}, {test: "test1"}, { testAssertion: "assertion1"}]);
      expect((storedResults.testsResults as any)["test1"]["testAssertionsResults"]["assertion1"]).toEqual(testResult);
    });

    it('should store multiple test assertion results', () => {
      // Set context first
      tracker.setTestSuite('testSuite1');
      tracker.setTest('test1');
      
      const testResult1: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok'
      };

      const testResult2: TestAssertionResult = {
        assertionName: 'assertion2',
        assertionResult: 'error',
        assertionExpectedValue: 'expected',
        assertionActualValue: 'actual'
      };

      tracker.setTestAssertionResult([{ testSuite: "testSuite1"}, {test: "test1"}, { testAssertion: "assertion1"}], testResult1 );
      tracker.setTestAssertionResult([{ testSuite: "testSuite1"}, {test: "test1"}, { testAssertion: "assertion2"}], testResult2 );
      // tracker.setTestAssertionResult(testResult2, []);
      
      // const storedResults = tracker.getTestAssertionsResults([{ testSuite: "testSuite1"}, {test: "test1"}, { testAssertion: "assertion1"}]);
      const storedResults = tracker.getTestAssertionsResults([{ testSuite: "testSuite1"}, {test: "test1"}]);
      expect((storedResults.testsResults as any)["test1"]["testAssertionsResults"]).toEqual({assertion1:testResult1, assertion2:testResult2});
      // expect(tracker.getTestAssertionsResults([{ testSuite: "testSuite1"}, {test: "test1"}, { testAssertion: "assertion2"}]).testsResults).toEqual(testResult2);
    });

    it('should clear test assertion results when clearing all data', () => {
      // Set context and add results
      tracker.setTestSuite('testSuite1');
      tracker.setTest('test1');
      
      const testResult: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok'
      };

      tracker.setTestAssertionResult([{ testSuite: "testSuite1"}, {test: "test1"}, { testAssertion: "assertion1"}], testResult);
      
      // Verify result exists
      const storedResults = tracker.getTestAssertionsResults([{ testSuite: "testSuite1"}, {test: "test1"}]);
      expect((storedResults.testsResults as any)['test1']['testAssertionsResults']['assertion1']).toEqual(testResult);
      // expect((storedResults.testsResults as any)['test1']['testAssertionsResults']).toEqual(testResult);
      // expect((storedResults.testsResults as any)['test1']).toEqual(testResult);
      
      tracker.clear();
      
      // Verify results are cleared
      expect(() => {
        tracker.getTestAssertionsResults([{ testSuite: "testSuite1"}, {test: "test1"}]);
      }).toThrowError(/getTestAssertionsResults TestSuite not found/);
      // expect(Object.keys(clearedResults)).toHaveLength(0);
    });
  });

  // describe('Subscriber notifications', () => {
  //   it('should notify subscribers when test context changes', () => {
  //     const mockCallback = vi.fn();
      
  //     const unsubscribe = tracker.subscribe(mockCallback);
      
  //     tracker.setTestSuite('testSuite1');
  //     expect(mockCallback).toHaveBeenCalledTimes(1);
  //     expect(mockCallback).toHaveBeenCalledWith({
  //       testSuite: 'testSuite1',
  //       test: undefined,
  //       testAssertion: undefined,
  //       timestamp: expect.any(Number)
  //     });

  //     tracker.setTest('test1');
  //     expect(mockCallback).toHaveBeenCalledTimes(2);
  //     expect(mockCallback).toHaveBeenCalledWith({
  //       testSuite: 'testSuite1',
  //       test: 'test1',
  //       testAssertion: undefined,
  //       timestamp: expect.any(Number)
  //     });

  //     unsubscribe();
  //   });

  //   it('should support multiple subscribers', () => {
  //     const mockCallback1 = vi.fn();
  //     const mockCallback2 = vi.fn();
      
  //     const unsubscribe1 = tracker.subscribe(mockCallback1);
  //     const unsubscribe2 = tracker.subscribe(mockCallback2);
      
  //     tracker.setTestSuite('testSuite1');

  //     expect(mockCallback1).toHaveBeenCalledTimes(1);
  //     expect(mockCallback2).toHaveBeenCalledTimes(1);

  //     unsubscribe1();
  //     unsubscribe2();
  //   });

  //   it('should allow unsubscribing from notifications', () => {
  //     const mockCallback = vi.fn();
      
  //     const unsubscribe = tracker.subscribe(mockCallback);
      
  //     tracker.setTestSuite('testSuite1');
  //     expect(mockCallback).toHaveBeenCalledTimes(1);

  //     unsubscribe();
  //     tracker.setTest('test1');
  //     expect(mockCallback).toHaveBeenCalledTimes(1); // Should not be called again
  //   });
  // });
});
