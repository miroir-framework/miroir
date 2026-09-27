/**
 * Issue #303 Slice 4: the `measureRendering` step puts per-component render measurements in the
 * test result (analysis D5, D9, D10, T4, T5, T7).
 *
 * A one-leaf `reactComponentTestSuite` on the Enum schema (props of `ui.mlElementEditor.enum`)
 * with `{step: "measureRendering", iterations: 2, mode: "both", updateProps: {initialFormState: "value3"}}`
 * is run through the real MiroirTest walk (`runMiroirTests._runMiroirTestSuite`, as the component
 * test vitest entry does) with the real component test runner and a real `MiroirActivityTracker`.
 * The leaf's `TestAssertionResult` read back from the tracker must carry `assertionMeasurements`
 * with `remount` and `update` entries for `MlEnumEditor` and `MlElementEditor`, and so must the
 * rows built by the app's `generateTestReport`. A second run with `iterationsOverride: 1` on the
 * runner yields one sample per component and mode.
 *
 * vitest, not a MiroirTest: the assertions read the tracker content produced by the walk (the
 * vehicle #286 used for runner results); timings are never asserted beyond their order (D9).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- measureRendering.303.phase4
 * ```
 */
import { configure, getConfig } from "@testing-library/dom";
import * as vitest from "vitest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  defaultMetaModelEnvironment,
  MiroirActivityTracker,
  MiroirEventService,
  runMiroirTests,
  type ReactComponentTestSuite,
  type TestAssertionResult,
  type TestSuiteResult,
} from "miroir-core";

import { createReactComponentTestRunner } from "../../../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";
import { generateTestReport } from "../../../../src/miroir-fwk/4_view/components/Buttons/testResultReport";

const LEAF_LABEL = "Enum: measure rendering";

/**
 * `finalValue`: the enum value shown after the step. `update` alternates `updateProps` and the
 * leaf's props, starting with `updateProps`: an odd iteration count ends on "value3", an even one
 * on the leaf's "value2" (checks that `rerender` applies the props).
 */
function enumMeasureSuite(suiteLabel: string, finalValue: string): ReactComponentTestSuite {
  return {
    miroirTestType: "reactComponentTestSuite",
    miroirTestLabel: suiteLabel,
    component: "MlElementEditor",
    componentProps: {
      label: "Test Label",
      name: "testField",
      listKey: "ROOT.testField",
      rootLessListKey: "testField",
      rootLessListKeyArray: ["testField"],
      rawMlSchema: { type: "enum", definition: ["value1", "value2", "value3"] },
      initialFormState: "value2",
    },
    miroirTests: [
      {
        miroirTestType: "reactComponentTest",
        miroirTestLabel: LEAF_LABEL,
        steps: [
          {
            step: "measureRendering",
            iterations: 2,
            mode: "both",
            updateProps: { initialFormState: "value3" },
          },
          {
            step: "expectElement",
            label: "value after the update iterations",
            target: { widget: "combobox", field: "testField" },
            value: finalValue,
          },
        ],
      },
    ],
  };
}

/** Every assertion result of the tracker results, at any depth. */
function allAssertionResults(results: TestSuiteResult): TestAssertionResult[] {
  const found: TestAssertionResult[] = [];
  for (const test of Object.values(results.testsResults ?? {})) {
    found.push(...Object.values(test.testAssertionsResults));
  }
  for (const suite of Object.values(results.testsSuiteResults ?? {})) {
    found.push(...allAssertionResults(suite));
  }
  return found;
}

function leafAssertion(tracker: MiroirActivityTracker): TestAssertionResult {
  const matches = allAssertionResults(tracker.getTestAssertionsResults([])).filter(
    (assertion) => assertion.assertionName === LEAF_LABEL,
  );
  expect(matches).toHaveLength(1);
  return matches[0];
}

function measurement(assertion: TestAssertionResult, componentId: string, mode: "remount" | "update") {
  const found = (assertion.assertionMeasurements ?? []).filter(
    (entry) => entry.componentId === componentId && entry.mode === mode,
  );
  expect(found, `${componentId} ${mode} in ${JSON.stringify(assertion.assertionMeasurements)}`).toHaveLength(1);
  return found[0];
}

// The component test driver does not use React `act`, and the runner configures
// `@testing-library/dom` without `act` wrappers: both are global to the worker, restored after the
// file (as renderInsightCoverage.303.phase3).
let previousActEnvironment: unknown;
let previousDomConfig: ReturnType<typeof getConfig>;
beforeAll(() => {
  previousActEnvironment = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  previousDomConfig = { ...getConfig() };
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
});

afterAll(() => {
  configure(previousDomConfig);
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

/**
 * Registers a runner (with `iterationsOverride`) for the tests of the enclosing `describe`, runs
 * the suite through the walk (one vitest test per leaf, failing when the leaf fails), and returns
 * the tracker, read by the tests registered after the walk.
 */
function measuredSuite(suiteLabel: string, iterationsOverride: number | undefined, finalValue: string) {
  const tracker = new MiroirActivityTracker();
  new MiroirEventService(tracker);
  const sandboxElement = document.createElement("div");
  let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
    document.body.appendChild(sandboxElement);
    runner = createReactComponentTestRunner({ sandboxElement, iterationsOverride });
    ConfigurationService.configurationService.registerReactComponentTestRunner(runner);
  });

  afterAll(() => {
    try {
      runner?.close();
    } finally {
      ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
      sandboxElement.remove();
    }
  });

  const walk = runMiroirTests._runMiroirTestSuite(
    vitest,
    ["measureRendering.303.phase4", suiteLabel],
    enumMeasureSuite(suiteLabel, finalValue),
    undefined,
    defaultMetaModelEnvironment,
    tracker,
    undefined,
    true,
    runMiroirTests,
    { executionMode: "unit", rethrowComponentTestFailures: true },
  );
  return { tracker, walk };
}

// ################################################################################################
describe("measureRendering.303.phase4: iterations 2, mode both", async () => {
  const { tracker, walk } = measuredSuite("EnumMeasure", undefined, "value2");
  await walk;

  it("the leaf is ok and carries remount and update measurements for MlEnumEditor and MlElementEditor", () => {
    const assertion = leafAssertion(tracker);
    expect(assertion.assertionResult).toBe("ok");
    for (const componentId of ["MlEnumEditor", "MlElementEditor"]) {
      for (const mode of ["remount", "update"] as const) {
        const entry = measurement(assertion, componentId, mode);
        expect(entry.count).toBeGreaterThanOrEqual(2);
        expect(entry.minMs).toBeLessThanOrEqual(entry.medianMs);
        expect(entry.medianMs).toBeLessThanOrEqual(entry.maxMs);
        expect(entry.totalMs).toBeGreaterThanOrEqual(entry.maxMs);
      }
    }
  });

  it("the rows of generateTestReport keep the measurements (Miroir Tests display)", () => {
    const rows = generateTestReport("measureRendering.303.phase4", tracker.getTestAssertionsResults([]), () => {});
    const row = rows.find((candidate) => candidate.testPath[candidate.testPath.length - 1] === LEAF_LABEL);
    expect(row, rows.map((candidate) => candidate.testName).join(", ")).toBeDefined();
    const assertions = row!.fullAssertionsResults as Record<string, TestAssertionResult>;
    expect(assertions[LEAF_LABEL].assertionMeasurements?.length ?? 0).toBeGreaterThan(0);
  });
});

describe("measureRendering.303.phase4: iterationsOverride 1 on the runner", async () => {
  const { tracker, walk } = measuredSuite("EnumMeasureOverride", 1, "value3");
  await walk;

  it("yields one sample per component and mode", () => {
    const assertion = leafAssertion(tracker);
    expect(assertion.assertionResult).toBe("ok");
    for (const componentId of ["MlEnumEditor", "MlElementEditor"]) {
      for (const mode of ["remount", "update"] as const) {
        expect(measurement(assertion, componentId, mode).count).toBe(1);
      }
    }
  });
});
