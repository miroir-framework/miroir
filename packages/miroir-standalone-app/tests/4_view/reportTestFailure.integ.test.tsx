/**
 * Report tests (#330): a failed `expectActionResult` step fails its `reportTest` leaf, which is
 * recorded as `error` with the step, the assertion label and the compared values.
 *
 * Not reachable through a MiroirTest (a MiroirTest cannot assert that another one fails): this
 * file runs `report.bookDetails` with a copy of its store-check leaf expecting a wrong name, and
 * reads what the tracker recorded. The leaf runs with a non-throwing `expect`, so its failure is
 * recorded without failing the vitest test that runs it.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem reportTestFailure.integ
 * ```
 */
import "@testing-library/jest-dom";
import * as vitest from "vitest";
import { describe, expect, it } from "vitest";

import {
  MiroirActivityTracker,
  TestFramework,
  defaultMetaModelEnvironment,
  runMiroirTests,
  type MiroirTestExecutionEnvironment,
  type MiroirTestForReport,
  type MiroirTestSuite,
  type ReportTestSuite,
  type TestAssertionResult,
  type TestSuiteResult,
  type VitestNamespace,
} from "miroir-core";

import { startReportTestEntry } from "../helpers/reportTestEntry.js";
import { loadRunnerOrActionMiroirTestSuite } from "../helpers/runMiroirRunnerTestsFromCLI.js";

const suiteKey = "report.bookDetails";
const leafLabel = "the store holds the displayed Book";
const wrongName = "Ubik";

/** `report.bookDetails` with only its store-check leaf, expecting `wrongName`. */
function suiteExpectingWrongName(): MiroirTestSuite {
  const suite = structuredClone(loadRunnerOrActionMiroirTestSuite(suiteKey));
  const reportSuite = suite.miroirTests[0] as ReportTestSuite;
  const leaf = reportSuite.miroirTests.find(
    (candidate) => candidate.miroirTestLabel === leafLabel,
  ) as MiroirTestForReport;
  for (const step of leaf.steps) {
    if (step.step === "expectActionResult") {
      step.assertion.payload.definition.expectedValue = { name: wrongName };
    }
  }
  reportSuite.miroirTests = [leaf];
  return suite;
}

/** The results recorded for `testLabel` in the suite at `suitePath`, if any. */
function recordedAssertions(
  tracker: MiroirActivityTracker,
  suitePath: string[],
  testLabel: string,
): Record<string, TestAssertionResult> | undefined {
  let suiteResult: TestSuiteResult | undefined = tracker.getTestAssertionsResults([]);
  for (const suite of suitePath) {
    suiteResult = suiteResult?.testsSuiteResults?.[suite];
  }
  return suiteResult?.testsResults?.[testLabel]?.testAssertionsResults;
}

const { miroirActivityTracker, createSession } = await startReportTestEntry();
const suite = suiteExpectingWrongName();
const holder: { value?: MiroirTestExecutionEnvironment } = {};

describe(`${suiteKey} expecting a wrong name`, async () => {
  let session: ReturnType<typeof createSession> | undefined;

  vitest.beforeAll(async () => {
    session = createSession(suiteKey, suite);
    holder.value = await session.initSession();
  });
  vitest.beforeEach(async () => {
    await session?.beforeEach();
  });
  vitest.afterAll(async () => {
    await session?.teardown();
  });

  // The walk registers the leaf's vitest test; the non-throwing `expect` only records its result.
  await runMiroirTests._runMiroirTestSuite(
    { ...vitest, expect: TestFramework.expect } as unknown as VitestNamespace,
    [suiteKey],
    suite,
    undefined,
    defaultMetaModelEnvironment,
    miroirActivityTracker,
    undefined,
    true,
    runMiroirTests,
    {
      executionMode: "integration",
      executionEnvironment: new Proxy({} as MiroirTestExecutionEnvironment, {
        get: (_target, key) => (holder.value as any)?.[key],
      }),
    },
  );

  it("records the leaf as error, with the failed step, the assertion label and the compared values", () => {
    const recorded = recordedAssertions(miroirActivityTracker, [suiteKey, "BookDetails"], leafLabel);
    const leafResult = recorded?.[leafLabel];
    expect(leafResult?.assertionResult).toBe("error");
    expect(leafResult?.assertionExpectedValue).toEqual({ name: wrongName });
    expect(leafResult?.assertionActualValue).toEqual({
      message:
        'step 3 (expectActionResult "the stored name is the displayed one"): assertion "storedBookName" failed',
      actual: { name: "The Design of Everyday Things" },
    });
  });
});
