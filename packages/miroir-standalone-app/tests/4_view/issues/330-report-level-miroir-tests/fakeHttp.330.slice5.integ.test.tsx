/**
 * Issue #330 Slice 5: a request of a Report to an external service that its suite declares no
 * fake HTTP response for fails the `reportTest` leaf, naming the method and the URL (analysis T9).
 *
 * Not reachable through a MiroirTest (a MiroirTest cannot assert that another one fails): this
 * file runs `report.connectExternalServiceWizard` with a fake response for another URL than the
 * one the leaf gives the wizard, without its last step (the wizard stays on the document step),
 * and reads what the tracker recorded. The leaf runs with a non-throwing `expect`, so its failure
 * is recorded without failing the vitest test that runs it.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem fakeHttp.330.slice5
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

import { startReportTestEntry } from "../../../helpers/reportTestEntry.js";
import { loadRunnerOrActionMiroirTestSuite } from "../../../helpers/runMiroirRunnerTestsFromCLI.js";

const suiteKey = "report.connectExternalServiceWizard";
const leafLabel = "reads an OpenAPI document by URL";
const declaredUrl = "https://fake-service.example/another-document.json";

/**
 * `report.connectExternalServiceWizard` whose only fake response is for `declaredUrl`, with its
 * leaf stopping once it has asked the wizard for the next step after the document step.
 */
function suiteWithoutTheDocumentResponse(): MiroirTestSuite {
  const suite = structuredClone(loadRunnerOrActionMiroirTestSuite(suiteKey));
  const reportSuite = suite.miroirTests[0] as ReportTestSuite;
  reportSuite.fakeHttpResponses = reportSuite.fakeHttpResponses?.map((response) => ({
    ...response,
    url: declaredUrl,
  }));
  const leaf = reportSuite.miroirTests.find(
    (candidate) => candidate.miroirTestLabel === leafLabel,
  ) as MiroirTestForReport;
  leaf.steps = leaf.steps.slice(0, -1);
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
const suite = suiteWithoutTheDocumentResponse();
const holder: { value?: MiroirTestExecutionEnvironment } = {};

describe(`${suiteKey} without a response for the document URL`, async () => {
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

  it("records the leaf as error, naming the method and the URL of the request", () => {
    const recorded = recordedAssertions(
      miroirActivityTracker,
      [suiteKey, "ConnectExternalServiceWizard"],
      leafLabel,
    );
    const leafResult = recorded?.[leafLabel];
    expect(leafResult?.assertionResult).toBe("error");
    expect(leafResult?.assertionActualValue).toBe(
      "no fake HTTP response declared for GET https://fake-service.example/openapi.json",
    );
  });
});
