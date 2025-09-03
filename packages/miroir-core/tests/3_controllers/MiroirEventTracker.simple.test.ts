import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MiroirEventTracker } from '../../src/3_controllers/MiroirEventTracker';
import { TestAssertionPath } from '../../src/0_interfaces/3_controllers/MiroirEventTrackerInterface';
import { TestAssertionResult } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';

describe('MiroirEventTracker - Basic Tests', () => {
  let tracker: MiroirEventTracker;

  beforeEach(() => {
    tracker = new MiroirEventTracker();
  });

  afterEach(() => {
    tracker.destroy();
  });

  it('should initialize correctly', () => {
    const results = tracker.getTestAssertionsResults([]);
    expect(results).toEqual({});
  });

  it('should set and retrieve a simple test assertion result', () => {
    console.log('Starting simple test assertion test');
    
    const testPath: TestAssertionPath = [
      { testSuite: 'TestSuite1' },
      { test: 'Test1' },
      { testAssertion: 'assertion1' }
    ];

    const assertionResult: TestAssertionResult = {
      assertionName: 'assertion1',
      assertionResult: 'ok',
      assertionExpectedValue: 'expected',
      assertionActualValue: 'expected'
    };

    console.log('Setting test assertion result...');
    tracker.setTestAssertionResult(testPath, assertionResult);

    console.log('Getting all results...');
    const allResults = tracker.getTestAssertionsResults([]);
    console.log('All results:', JSON.stringify(allResults, null, 2));

    expect(allResults).toHaveProperty('testsSuiteResults');
    expect(allResults.testsSuiteResults).toHaveProperty('TestSuite1');
  });
});
