/**
 * Issue #330 Slice 1: the `reportTest` leaf in the MiroirTest walk, and how a suite with such
 * leaves is classified.
 *
 * Runs in-process with `TestFramework`. Each test restores the registered report test runner in
 * `finally`.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-core -- reportTestLeaf.330.slice1
 * ```
 */
import { describe, expect, it } from "vitest";

import type {
  MiroirTestForReport,
  MiroirTestSuite,
  TestAssertionResult,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { ReportTestSuiteContext } from "../../../../src/0_interfaces/5-tests/miroirTestTypes";
import { defaultMetaModelEnvironment } from "../../../../src/1_core/Model";
import { TestFramework } from "../../../../src/1_core/testing/test-expect";
import { ConfigurationService } from "../../../../src/3_controllers/ConfigurationService";
import { MiroirActivityTracker } from "../../../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../../../src/3_controllers/MiroirEventService";
import { classifyApplicationMiroirTestCliLaunchKind } from "../../../../src/5_tests/applicationMiroirTestCatalog";
import {
  inferIntegrationSessionKind,
  miroirTestSuiteMountsReport,
} from "../../../../src/5_tests/inferIntegrationSessionKind";
import {
  runMiroirTests,
  type MiroirTestExecutionEnvironment,
  type MiroirTestExecutionOptions,
  type VitestNamespace,
} from "../../../../src/5_tests/MiroirTestTools";
import { miroirTestSuiteModeTags } from "../../../../src/5_tests/miroirTestTags";
import { REPORT_TEST_NO_RUNNER_MESSAGE } from "../../../../src/5_tests/ReportTestTools";

const suiteLabel = "reportTestLeaf.330.slice1";

const report: ReportTestSuiteContext["report"] = {
  application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
  applicationSection: "data",
  reportUuid: "c3503412-3d8a-43ef-a168-aa36e975e606",
  instanceUuid: "e20e276b-619d-4e16-8816-b7ec37b53439",
};

function reportLeaf(label: string): MiroirTestForReport {
  return { miroirTestType: "reportTest", miroirTestLabel: label, steps: [] };
}

/** The leaves under a `reportTestSuite` child of a `miroirTestSuite` root. */
function suiteOf(...leaves: MiroirTestForReport[]): MiroirTestSuite {
  return {
    miroirTestType: "miroirTestSuite",
    miroirTestLabel: suiteLabel,
    miroirTests: [
      {
        miroirTestType: "reportTestSuite",
        miroirTestLabel: "BookDetails",
        report,
        actionTimeoutMs: 5000,
        miroirTests: leaves,
      },
    ],
  };
}

/** The walk reads nothing from the environment; the runner receives it as is. */
const executionEnvironment = { testApplicationUuid: report.application } as MiroirTestExecutionEnvironment;
const integrationOptions: MiroirTestExecutionOptions = {
  executionMode: "integration",
  executionEnvironment,
};

async function runSuiteInProcess(
  suite: MiroirTestSuite,
  executionOptions: MiroirTestExecutionOptions = integrationOptions,
): Promise<MiroirActivityTracker> {
  const tracker = new MiroirActivityTracker();
  // Nested suites are tracked through `trackTestSuite`, which needs an event service.
  new MiroirEventService(tracker);
  await runMiroirTests._runMiroirTestSuite(
    TestFramework as unknown as VitestNamespace,
    [suiteLabel],
    suite,
    undefined,
    defaultMetaModelEnvironment,
    tracker,
    undefined,
    true,
    runMiroirTests,
    executionOptions,
  );
  return tracker;
}

/** Every assertion result recorded in the tracker, keyed by assertion name. */
function recordedAssertions(tracker: MiroirActivityTracker): Record<string, TestAssertionResult> {
  const found: Record<string, TestAssertionResult> = {};
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") {
      return;
    }
    const candidate = node as Partial<TestAssertionResult>;
    if (typeof candidate.assertionName === "string" && typeof candidate.assertionResult === "string") {
      found[candidate.assertionName] = candidate as TestAssertionResult;
      return;
    }
    Object.values(node).forEach(visit);
  };
  visit(tracker.getTestAssertionsResults([]));
  return found;
}

async function withRegisteredRunner(
  runner: Parameters<typeof ConfigurationService.configurationService.registerReportTestRunner>[0],
  body: () => Promise<void>,
): Promise<void> {
  const previous = ConfigurationService.configurationService.reportTestRunner;
  ConfigurationService.configurationService.registerReportTestRunner(runner);
  try {
    await body();
  } finally {
    ConfigurationService.configurationService.registerReportTestRunner(previous);
  }
}

// ################################################################################################
describe("a suite with reportTest leaves", () => {
  it("needs an action session, launches as runner-integration, mounts a Report and carries the integ and ui mode tags", () => {
    const suite = suiteOf(reportLeaf("displays the Book"));
    expect(inferIntegrationSessionKind(suite)).toBe("action");
    expect(classifyApplicationMiroirTestCliLaunchKind(suite)).toBe("runner-integration");
    expect(miroirTestSuiteMountsReport(suite)).toBe(true);
    expect(miroirTestSuiteModeTags(suite)).toEqual(["integ", "ui"]);
  });
});

describe("reportTest leaf", () => {
  it("passes the leaf, its suite context and the execution environment to the registered runner", async () => {
    const calls: { label: string; suite: ReportTestSuiteContext; environment: unknown }[] = [];
    await withRegisteredRunner(
      async ({ leaf, suite, executionEnvironment: environment }) => {
        calls.push({ label: leaf.miroirTestLabel, suite, environment });
        return { status: "ok" };
      },
      async () => {
        const tracker = await runSuiteInProcess(
          suiteOf(reportLeaf("displays the Book"), reportLeaf("saves an edited title")),
        );
        const results = recordedAssertions(tracker);
        expect(results["displays the Book"]?.assertionResult).toBe("ok");
        expect(results["saves an edited title"]?.assertionResult).toBe("ok");
      },
    );
    expect(calls.map((call) => call.label)).toEqual(["displays the Book", "saves an edited title"]);
    expect(calls[0].suite).toEqual({
      suiteKind: "reportTestSuite",
      suitePath: [suiteLabel, "BookDetails"],
      report,
      actionTimeoutMs: 5000,
      caseLabels: ["displays the Book", "saves an edited title"],
    });
    expect(calls[0].environment).toBe(executionEnvironment);
  });

  it("with no runner registered, records skipped with a message and does not throw", async () => {
    await withRegisteredRunner(undefined, async () => {
      const tracker = await runSuiteInProcess(suiteOf(reportLeaf("displays the Book")));
      const results = recordedAssertions(tracker);
      expect(results["displays the Book"]?.assertionResult).toBe("skipped");
      expect(JSON.stringify(results["displays the Book"])).toContain(REPORT_TEST_NO_RUNNER_MESSAGE);
    });
  });

  it("with a runner returning error, records the error with the runner's message and fails the test", async () => {
    // vitest's throwing `expect`, as under the CLI (TestFramework's `expect` only reports)
    const throwingVitest = { ...TestFramework, expect } as unknown as VitestNamespace;
    await withRegisteredRunner(
      async () => ({ status: "error", message: "the Book is not displayed" }),
      async () => {
        const tracker = new MiroirActivityTracker();
        new MiroirEventService(tracker);
        await expect(
          runMiroirTests._runMiroirTestSuite(
            throwingVitest,
            [suiteLabel],
            suiteOf(reportLeaf("displays the Book")),
            undefined,
            defaultMetaModelEnvironment,
            tracker,
            undefined,
            true,
            runMiroirTests,
            integrationOptions,
          ),
        ).rejects.toThrow("the Book is not displayed");
        const results = recordedAssertions(tracker);
        expect(results["displays the Book"]?.assertionResult).toBe("error");
        expect(JSON.stringify(results["displays the Book"])).toContain("the Book is not displayed");
      },
    );
  });

  it("in unit mode, is refused: a Report needs an integration session", async () => {
    await withRegisteredRunner(
      async () => ({ status: "ok" }),
      async () => {
        await expect(
          runSuiteInProcess(suiteOf(reportLeaf("displays the Book")), { executionMode: "unit" }),
        ).rejects.toThrow("reportTest leaves require executionMode integration");
      },
    );
  });
});
