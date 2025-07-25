// import { describe, it, expect, beforeEach } from 'vitest';
import { TestAssertionResult } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';
import { LoggerGlobalContext } from '../../src/4_services/LoggerContext';
import { TestSuiteContext } from '../../src/4_services/TestSuiteContext';

describe('TestSuiteContext', () => {
  // beforeEach(() => {
  //   TestSuiteContext.resetContext();
  // });

  describe('getTestResult', () => {
    beforeEach(() => {
      TestSuiteContext.resetContext();
      TestSuiteContext.resetResults();
    });

    it('should return "ok" if all assertions pass', () => {
      LoggerGlobalContext.setTestSuite('TestSuite1');
      LoggerGlobalContext.setTest('Test1');
      const testAssertionResult: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok',
      };
      TestSuiteContext.setTestAssertionResult(testAssertionResult);

      const result = TestSuiteContext.getTestResult('TestSuite1', 'Test1');
      expect(result.testResult).toBe('ok');
    });

    it('should return "error" if any assertion fails', () => {
      LoggerGlobalContext.setTestSuite('TestSuite1');
      LoggerGlobalContext.setTest('Test1');
      const testAssertionResult1: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok',
      };
      const testAssertionResult2: TestAssertionResult = {
        assertionName: 'assertion2',
        assertionResult: 'error',
      };
      TestSuiteContext.setTestAssertionResult(testAssertionResult1);
      TestSuiteContext.setTestAssertionResult(testAssertionResult2);

      const result = TestSuiteContext.getTestResult('TestSuite1', 'Test1');
      expect(result.testResult).toBe('error');
    });

    it('should throw an error if the test is not defined', () => {
      expect(() => {
        TestSuiteContext.getTestResult('TestSuite1', 'Test1');
      }).toThrow("Test not defined: Test1 in TestSuite1");
    });
  });

  describe('getTestSuiteResult', () => {
    beforeEach(() => {
      TestSuiteContext.resetContext();
      TestSuiteContext.resetResults();
    });

    it('should return the correct test suite result when all tests pass', () => {
      // TestSuiteContext.resetContext();
      LoggerGlobalContext.setTestSuite('TestSuite1');
      LoggerGlobalContext.setTest('Test1');
      const testAssertionResult: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok',
      };
      TestSuiteContext.setTestAssertionResult(testAssertionResult);

      LoggerGlobalContext.setTest('Test2');
      const testAssertionResult2: TestAssertionResult = {
        assertionName: 'assertion2',
        assertionResult: 'ok',
      };
      TestSuiteContext.setTestAssertionResult(testAssertionResult2);

      const result = TestSuiteContext.getTestSuiteResult('TestSuite1');
      expect(result).toEqual({
        TestSuite1: {
          Test1: {
            testLabel: 'Test1',
            testResult: 'ok',
            testAssertionsResults: {
              assertion1: testAssertionResult,
            },
          },
          Test2: {
            testLabel: 'Test2',
            testResult: 'ok',
            testAssertionsResults: {
              assertion2: testAssertionResult2,
            },
          },
        },
      });
    });

    it('should return the correct test suite result when some tests fail', () => {
      // TestSuiteContext.resetContext();
      LoggerGlobalContext.setTestSuite('TestSuite1');
      LoggerGlobalContext.setTest('Test1');
      const testAssertionResult: TestAssertionResult = {
        assertionName: 'assertion1',
        assertionResult: 'ok',
      };
      TestSuiteContext.setTestAssertionResult(testAssertionResult);

      LoggerGlobalContext.setTest('Test2');
      const testAssertionResult2: TestAssertionResult = {
        assertionName: 'assertion2',
        assertionResult: 'error',
      };
      TestSuiteContext.setTestAssertionResult(testAssertionResult2);

      const result = TestSuiteContext.getTestSuiteResult('TestSuite1');
      expect(result).toEqual({
        TestSuite1: {
          Test1: {
            testLabel: 'Test1',
            testResult: 'ok',
            testAssertionsResults: {
              assertion1: testAssertionResult,
            },
          },
          Test2: {
            testLabel: 'Test2',
            testResult: 'error',
            testAssertionsResults: {
              assertion2: testAssertionResult2,
            },
          },
        },
      });
    });

    it('should throw an error if the test suite is not defined', () => {
      TestSuiteContext.resetContext();
      expect(() => {
        TestSuiteContext.getTestSuiteResult('TestSuite1');
      }).toThrow("TestSuite is not defined: TestSuite1");
    });
  });

});