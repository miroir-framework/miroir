import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MiroirActivityTracker } from '../../src/3_controllers/MiroirActivityTracker';
import { MiroirActivityTrackerInterface, TestAssertionPath } from '../../src/0_interfaces/3_controllers/MiroirActivityTrackerInterface';
import { TestAssertionResult, TestResult, TestSuiteResult } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';
import { transformerTestsDisplayResults } from '../../src/4_services/TestTools';

describe('MiroirActivityTracker - Test Results Management', () => {
  let tracker: MiroirActivityTrackerInterface;

  beforeEach(() => {
    tracker = new MiroirActivityTracker();
  });

  afterEach(() => {
  });

  describe('Test Assertion Results Management', () => {
    it('should initialize with empty test results', () => {
      const results = tracker.getTestAssertionsResults([]);
      expect(results).toEqual({});
    });

    it('should set and retrieve a simple test assertion result', () => {
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

      // Set the assertion result
      tracker.setTestAssertionResult(testPath, assertionResult);

      // Verify the structure was created correctly
      const allResults = tracker.getTestAssertionsResults([]);
      expect(allResults).toHaveProperty('testsSuiteResults');
      expect(allResults.testsSuiteResults).toHaveProperty('TestSuite1');
      expect(allResults.testsSuiteResults!['TestSuite1']).toHaveProperty('testsResults');
      expect(allResults.testsSuiteResults!['TestSuite1'].testsResults).toHaveProperty('Test1');

      // Get the specific test result
      const testResult = tracker.getTestResult([
        { testSuite: 'TestSuite1' },
        { test: 'Test1' }
      ]);

      expect(testResult).toEqual({
        testLabel: 'Test1',
        testResult: 'ok',
        testAssertionsResults: {
          assertion1: assertionResult
        }
      });
    });

    it('should handle multiple assertions in the same test', () => {
      const basePath: TestAssertionPath = [
        { testSuite: 'TestSuite1' },
        { test: 'Test1' }
      ];

      const assertion1: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok',
        assertionExpectedValue: 'value1',
        assertionActualValue: 'value1'
      };

      const assertion2: TestAssertionResult = {
        assertionName: 'assertion2',
        assertionResult: 'ok',
        assertionExpectedValue: 'value2',
        assertionActualValue: 'value2'
      };

      // Set both assertions
      tracker.setTestAssertionResult([...basePath, { testAssertion: 'assertion1' }], assertion1);
      tracker.setTestAssertionResult([...basePath, { testAssertion: 'assertion2' }], assertion2);

      // Get the test result
      const testResult = tracker.getTestResult(basePath);

      expect(testResult.testResult).toBe('ok');
      expect(testResult.testAssertionsResults).toHaveProperty('assertion1');
      expect(testResult.testAssertionsResults).toHaveProperty('assertion2');
      expect(testResult.testAssertionsResults.assertion1).toEqual(assertion1);
      expect(testResult.testAssertionsResults.assertion2).toEqual(assertion2);
    });

    it('should mark test as error when any assertion fails', () => {
      const basePath: TestAssertionPath = [
        { testSuite: 'TestSuite1' },
        { test: 'Test1' }
      ];

      const successAssertion: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok',
        assertionExpectedValue: 'value1',
        assertionActualValue: 'value1'
      };

      const failedAssertion: TestAssertionResult = {
        assertionName: 'assertion2',
        assertionResult: 'error',
        assertionExpectedValue: 'expected',
        assertionActualValue: 'actual'
      };

      // Set success assertion first
      tracker.setTestAssertionResult([...basePath, { testAssertion: 'assertion1' }], successAssertion);
      let testResult = tracker.getTestResult(basePath);
      expect(testResult.testResult).toBe('ok');

      // Add failed assertion
      tracker.setTestAssertionResult([...basePath, { testAssertion: 'assertion2' }], failedAssertion);
      testResult = tracker.getTestResult(basePath);
      expect(testResult.testResult).toBe('error');
    });

    it('should handle nested test suites', () => {
      const nestedPath: TestAssertionPath = [
        { testSuite: 'ParentSuite' },
        { testSuite: 'ChildSuite' },
        { test: 'NestedTest' },
        { testAssertion: 'nestedAssertion' }
      ];

      const assertionResult: TestAssertionResult = {
        assertionName: 'nestedAssertion',
        assertionResult: 'ok'
      };

      tracker.setTestAssertionResult(nestedPath, assertionResult);

      // Verify nested structure
      const parentSuiteResult = tracker.getTestSuiteResult([{ testSuite: 'ParentSuite' }]);
      expect(parentSuiteResult).toHaveProperty('testsSuiteResults');
      expect(parentSuiteResult.testsSuiteResults).toHaveProperty('ChildSuite');

      const childSuiteResult = tracker.getTestSuiteResult([
        { testSuite: 'ParentSuite' },
        { testSuite: 'ChildSuite' }
      ]);
      expect(childSuiteResult).toHaveProperty('testsResults');
      expect(childSuiteResult.testsResults).toHaveProperty('NestedTest');

      // Get the nested test result
      const testResult = tracker.getTestResult([
        { testSuite: 'ParentSuite' },
        { testSuite: 'ChildSuite' },
        { test: 'NestedTest' }
      ]);

      expect(testResult.testLabel).toBe('NestedTest');
      expect(testResult.testResult).toBe('ok');
      expect(testResult.testAssertionsResults.nestedAssertion).toEqual(assertionResult);
    });

    it('should handle multiple tests in the same test suite', () => {
      const suite1Test1Path: TestAssertionPath = [
        { testSuite: 'TestSuite1' },
        { test: 'Test1' },
        { testAssertion: 'assertion1' }
      ];

      const suite1Test2Path: TestAssertionPath = [
        { testSuite: 'TestSuite1' },
        { test: 'Test2' },
        { testAssertion: 'assertion1' }
      ];

      const assertion1: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok'
      };

      const assertion2: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'error'
      };

      tracker.setTestAssertionResult(suite1Test1Path, assertion1);
      tracker.setTestAssertionResult(suite1Test2Path, assertion2);

      // Get test suite result
      const suiteResult = tracker.getTestSuiteResult([{ testSuite: 'TestSuite1' }]);
      expect(suiteResult).toHaveProperty('testsResults');
      expect(suiteResult.testsResults).toHaveProperty('Test1');
      expect(suiteResult.testsResults).toHaveProperty('Test2');

      // Verify individual test results
      const test1Result = tracker.getTestResult([
        { testSuite: 'TestSuite1' },
        { test: 'Test1' }
      ]);
      expect(test1Result.testResult).toBe('ok');

      const test2Result = tracker.getTestResult([
        { testSuite: 'TestSuite1' },
        { test: 'Test2' }
      ]);
      expect(test2Result.testResult).toBe('error');
    });

    it('should handle multiple test suites', () => {
      const suite1Path: TestAssertionPath = [
        { testSuite: 'TestSuite1' },
        { test: 'Test1' },
        { testAssertion: 'assertion1' }
      ];

      const suite2Path: TestAssertionPath = [
        { testSuite: 'TestSuite2' },
        { test: 'Test1' },
        { testAssertion: 'assertion1' }
      ];

      const assertion1: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok'
      };

      const assertion2: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'error'
      };

      tracker.setTestAssertionResult(suite1Path, assertion1);
      tracker.setTestAssertionResult(suite2Path, assertion2);

      // Get root results
      const allResults = tracker.getTestAssertionsResults([]);
      expect(allResults.testsSuiteResults).toHaveProperty('TestSuite1');
      expect(allResults.testsSuiteResults).toHaveProperty('TestSuite2');

      // Verify individual suite results
      const suite1Result = tracker.getTestSuiteResult([{ testSuite: 'TestSuite1' }]);
      const suite2Result = tracker.getTestSuiteResult([{ testSuite: 'TestSuite2' }]);

      expect(suite1Result.testsResults).toHaveProperty('Test1');
      expect(suite2Result.testsResults).toHaveProperty('Test1');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid test assertion result', () => {
      const testPath: TestAssertionPath = [
        { testSuite: 'TestSuite1' },
        { test: 'Test1' },
        { testAssertion: 'assertion1' }
      ];

      expect(() => {
        // @ts-ignore - Testing invalid input
        tracker.setTestAssertionResult(testPath, null);
      }).toThrow('Invalid testAssertionResult or missing assertionName');

      expect(() => {
        // @ts-ignore - Testing invalid input
        tracker.setTestAssertionResult(testPath, { assertionResult: 'ok' });
      }).toThrow('Invalid testAssertionResult or missing assertionName');
    });

    it('should throw error for empty test assertion path', () => {
      expect(() => {
        tracker.setTestAssertionResult([], {
          assertionName: 'test',
          assertionResult: 'ok'
        });
      }).toThrow('testAssertionPath cannot be empty');
    });

    it('should throw error when trying to get non-existent test suite', () => {
      expect(() => {
        tracker.getTestSuiteResult([{ testSuite: 'NonExistentSuite' }]);
      }).toThrow('getTestSuiteResult TestSuite not found: NonExistentSuite');
    });

    it('should throw error when trying to get non-existent test', () => {
      // First create a test suite
      tracker.setTestAssertionResult([
        { testSuite: 'TestSuite1' },
        { test: 'Test1' },
        { testAssertion: 'assertion1' }
      ], {
        assertionName: 'assertion1',
        assertionResult: 'ok'
      });

      expect(() => {
        tracker.getTestResult([
          { testSuite: 'TestSuite1' },
          { test: 'NonExistentTest' }
        ]);
      }).toThrow('getTestResult Test not found: NonExistentTest');
    });

    it('should throw error when path does not contain test element', () => {
      expect(() => {
        tracker.getTestResult([{ testSuite: 'TestSuite1' }]);
      }).toThrow('getTestResult: Path does not contain a test element');
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle a complete test scenario with multiple levels', () => {
      // Simulate a complete test run with multiple suites, tests, and assertions
      const scenarios = [
        {
          path: [{ testSuite: 'FeatureA' }, { test: 'happyPath' }, { testAssertion: 'assertion1' }],
          result: { assertionName: 'assertion1', assertionResult: 'ok' as const }
        },
        {
          path: [{ testSuite: 'FeatureA' }, { test: 'happyPath' }, { testAssertion: 'assertion2' }],
          result: { assertionName: 'assertion2', assertionResult: 'ok' as const }
        },
        {
          path: [{ testSuite: 'FeatureA' }, { test: 'errorPath' }, { testAssertion: 'assertion1' }],
          result: { assertionName: 'assertion1', assertionResult: 'error' as const, assertionExpectedValue: 'success', assertionActualValue: 'failure' }
        },
        {
          path: [{ testSuite: 'FeatureB' }, { test: 'integration' }, { testAssertion: 'assertion1' }],
          result: { assertionName: 'assertion1', assertionResult: 'ok' as const }
        },
        {
          path: [{ testSuite: 'FeatureB' }, { testSuite: 'SubFeature' }, { test: 'nestedTest' }, { testAssertion: 'assertion1' }],
          result: { assertionName: 'assertion1', assertionResult: 'ok' as const }
        }
      ];

      // Set all test results
      scenarios.forEach(scenario => {
        tracker.setTestAssertionResult(scenario.path, scenario.result);
      });

      // Verify the complete structure
      const allResults = tracker.getTestAssertionsResults([]);
      expect(allResults.testsSuiteResults).toHaveProperty('FeatureA');
      expect(allResults.testsSuiteResults).toHaveProperty('FeatureB');

      // Verify FeatureA results
      const featureAResult = tracker.getTestSuiteResult([{ testSuite: 'FeatureA' }]);
      expect(featureAResult.testsResults).toHaveProperty('happyPath');
      expect(featureAResult.testsResults).toHaveProperty('errorPath');

      const happyPathResult = tracker.getTestResult([{ testSuite: 'FeatureA' }, { test: 'happyPath' }]);
      expect(happyPathResult.testResult).toBe('ok');
      expect(Object.keys(happyPathResult.testAssertionsResults)).toHaveLength(2);

      const errorPathResult = tracker.getTestResult([{ testSuite: 'FeatureA' }, { test: 'errorPath' }]);
      expect(errorPathResult.testResult).toBe('error');

      // Verify FeatureB results
      const featureBResult = tracker.getTestSuiteResult([{ testSuite: 'FeatureB' }]);
      expect(featureBResult.testsResults).toHaveProperty('integration');
      expect(featureBResult.testsSuiteResults).toHaveProperty('SubFeature');

      // Verify nested structure
      const subFeatureResult = tracker.getTestSuiteResult([
        { testSuite: 'FeatureB' },
        { testSuite: 'SubFeature' }
      ]);
      expect(subFeatureResult.testsResults).toHaveProperty('nestedTest');

      const nestedTestResult = tracker.getTestResult([
        { testSuite: 'FeatureB' },
        { testSuite: 'SubFeature' },
        { test: 'nestedTest' }
      ]);
      expect(nestedTestResult.testResult).toBe('ok');
    });

    it('should maintain consistency across different access patterns', () => {
      // Set up some test data
      const testPath: TestAssertionPath = [
        { testSuite: 'Suite1' },
        { test: 'Test1' },
        { testAssertion: 'assertion1' }
      ];

      const assertionResult: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok',
        assertionExpectedValue: 'expected',
        assertionActualValue: 'expected'
      };

      tracker.setTestAssertionResult(testPath, assertionResult);

      // Access the same data through different methods
      const viaGetTestResult = tracker.getTestResult([
        { testSuite: 'Suite1' },
        { test: 'Test1' }
      ]);

      const viaGetTestSuiteResult = tracker.getTestSuiteResult([{ testSuite: 'Suite1' }]);
      const testFromSuite = viaGetTestSuiteResult.testsResults!['Test1'];

      const viaGetTestAssertionsResults = tracker.getTestAssertionsResults([]);
      const testFromRoot = viaGetTestAssertionsResults.testsSuiteResults!['Suite1'].testsResults!['Test1'];

      // All should be consistent
      expect(viaGetTestResult).toEqual(testFromSuite);
      expect(viaGetTestResult).toEqual(testFromRoot);
      expect(testFromSuite).toEqual(testFromRoot);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty test assertion path for getTestAssertionsResults', () => {
      const result = tracker.getTestAssertionsResults([]);
      expect(result).toEqual({});
    });

    it('should create intermediate nodes correctly when path elements are missing', () => {
      // Start with deeply nested path - should create all intermediate nodes
      const deepPath: TestAssertionPath = [
        { testSuite: 'Level1' },
        { testSuite: 'Level2' },
        { testSuite: 'Level3' },
        { test: 'DeepTest' },
        { testAssertion: 'deepAssertion' }
      ];

      const assertionResult: TestAssertionResult = {
        assertionName: 'deepAssertion',
        assertionResult: 'ok'
      };

      tracker.setTestAssertionResult(deepPath, assertionResult);

      // Verify all intermediate levels exist
      const level1 = tracker.getTestSuiteResult([{ testSuite: 'Level1' }]);
      expect(level1.testsSuiteResults).toHaveProperty('Level2');

      const level2 = tracker.getTestSuiteResult([
        { testSuite: 'Level1' },
        { testSuite: 'Level2' }
      ]);
      expect(level2.testsSuiteResults).toHaveProperty('Level3');

      const level3 = tracker.getTestSuiteResult([
        { testSuite: 'Level1' },
        { testSuite: 'Level2' },
        { testSuite: 'Level3' }
      ]);
      expect(level3.testsResults).toHaveProperty('DeepTest');

      const deepTest = tracker.getTestResult([
        { testSuite: 'Level1' },
        { testSuite: 'Level2' },
        { testSuite: 'Level3' },
        { test: 'DeepTest' }
      ]);
      expect(deepTest.testAssertionsResults.deepAssertion).toEqual(assertionResult);
    });
  });

  describe('transformerTestsDisplayResults', () => {
    it('should display test results in vitest format', () => {
      // Set up some test data
      const path1: TestAssertionPath = [
        { testSuite: 'FeatureA' },
        { test: 'happyPath' },
        { testAssertion: 'assertion1' }
      ];
      
      const path2: TestAssertionPath = [
        { testSuite: 'FeatureA' },
        { test: 'errorPath' },
        { testAssertion: 'assertion1' }
      ];
      
      const path3: TestAssertionPath = [
        { testSuite: 'FeatureB' },
        { testSuite: 'SubFeature' },
        { test: 'nestedTest' },
        { testAssertion: 'assertion1' }
      ];

      // Add successful test
      tracker.setTestAssertionResult(path1, {
        assertionName: 'assertion1',
        assertionResult: 'ok'
      });

      // Add failed test
      tracker.setTestAssertionResult(path2, {
        assertionName: 'assertion1',
        assertionResult: 'error',
        assertionExpectedValue: 'success',
        assertionActualValue: 'failure'
      });

      // Add nested test
      tracker.setTestAssertionResult(path3, {
        assertionName: 'assertion1',
        assertionResult: 'ok'
      });

      // Capture console output
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
      };

      // Call the function
      transformerTestsDisplayResults(
        {} as any, // transformerTestSuite not used in display logic
        'testSuiteName',
        'testSuiteName',
        tracker
      );

      // Restore console.log
      console.log = originalLog;

      // Verify output format
      expect(consoleLogs.some(log => log.includes('transformerTestsDisplayResults'))).toBe(true);
      expect(consoleLogs.some(log => log.includes('FeatureA > happyPath [ok]'))).toBe(true);
      expect(consoleLogs.some(log => log.includes('FeatureA > errorPath [error]'))).toBe(true);
      expect(consoleLogs.some(log => log.includes('FeatureB > SubFeature > nestedTest [ok]'))).toBe(true);
      expect(consoleLogs.some(log => log.includes('Failed assertions: assertion1'))).toBe(true);
    });
  });
});
