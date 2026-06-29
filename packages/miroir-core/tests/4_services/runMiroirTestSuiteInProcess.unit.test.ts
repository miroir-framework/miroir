import assert from "node:assert/strict";

import { describe, expect, it } from "vitest";

import {
  defaultMetaModelEnvironment,
  MiroirActivityTracker,
  runMiroirTests,
  runMiroirTestSuiteInProcess,
  type MiroirTestSuite,
} from "../../src";

function createMinimalExpect() {
  return ((actual: unknown) => ({
    toBe(expected: unknown) {
      assert.strictEqual(actual, expected);
    },
    toEqual(expected: unknown) {
      assert.deepStrictEqual(actual, expected);
    },
  })) as unknown as Parameters<typeof runMiroirTestSuiteInProcess>[0]["expect"];
}

function suiteTestResults(tracker: MiroirActivityTracker, suiteLabel: string) {
  return tracker.getTestAssertionsResults([{ testSuite: suiteLabel }]).testsResults ?? {};
}

function mockSuite(): MiroirTestSuite {
  return {
    miroirTestType: "miroirTestSuite",
    miroirTestLabel: "inProcess.demo",
    miroirTests: [
      {
        miroirTestType: "functionCallTest",
        miroirTestLabel: "leaf one",
        functionRef: {
          module: "miroir-core/1_core/mustache",
          export: "extractDoubleBracePatterns",
        },
        arguments: ["Hello {{ name }}!"],
        expectedValue: [{ content: "name", start: 6, end: 15 }],
      },
      {
        miroirTestType: "functionCallTest",
        miroirTestLabel: "leaf two",
        functionRef: {
          module: "miroir-core/1_core/mustache",
          export: "extractDoubleBracePatterns",
        },
        arguments: ["Hello {{ name }}!"],
        expectedValue: [{ content: "name", start: 6, end: 15 }],
      },
    ],
  };
}

describe("runMiroirTestSuiteInProcess (B2)", () => {
  it("runs two unit leaves and records results on the tracker without vitest.test", async () => {
    const tracker = new MiroirActivityTracker();
    const suite = mockSuite();

    await runMiroirTestSuiteInProcess({
      runMiroirTests,
      expect: createMinimalExpect(),
      testSuitePath: ["inProcess.demo"],
      miroirTestSuite: suite,
      filter: undefined,
      modelEnvironment: defaultMetaModelEnvironment,
      miroirActivityTracker: tracker,
      executionOptions: { executionMode: "unit" },
    });

    const results = suiteTestResults(tracker, "inProcess.demo");
    expect(Object.keys(results)).toContain("leaf one");
    expect(Object.keys(results)).toContain("leaf two");
    expect(results["leaf one"]?.testResult).toBe("ok");
    expect(results["leaf two"]?.testResult).toBe("ok");
  });

  it("honours suite filter and runs only selected leaves", async () => {
    const tracker = new MiroirActivityTracker();
    const suite = mockSuite();

    await runMiroirTestSuiteInProcess({
      runMiroirTests,
      expect: createMinimalExpect(),
      testSuitePath: ["inProcess.demo"],
      miroirTestSuite: suite,
      filter: { testList: { "inProcess.demo": ["leaf two"] } },
      modelEnvironment: defaultMetaModelEnvironment,
      miroirActivityTracker: tracker,
      executionOptions: { executionMode: "unit" },
    });

    const results = suiteTestResults(tracker, "inProcess.demo");
    expect(Object.keys(results)).not.toContain("leaf one");
    expect(Object.keys(results)).toContain("leaf two");
  });
});
