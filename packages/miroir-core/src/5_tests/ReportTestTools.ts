// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
type VitestNamespace = typeof vitest;

import type {
  CompositeActionTemplate,
  CoreTransformerForBuildPlusRuntime_getFromContext,
  MiroirTestForReport,
  ReactComponentTestStep,
  ReactComponentTestTarget,
  ReportTestCompositeActionStep,
  ReportTestExpectActionResultStep,
  TestAssertionResult,
  TestSuiteResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  Action2Error,
  Domain2ElementFailed,
  TransformerFailure,
  type Action2ReturnType,
} from "../0_interfaces/2_domain/DomainElement";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { resolveCompositeActionTemplate } from "../2_domain/ResolveCompositeActionTemplate";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type {
  MiroirTestRunFilter,
  ReportTestRunnerResult,
  ReportTestSuiteContext,
} from "../0_interfaces/5-tests/miroirTestTypes";
import { ConfigurationService } from "../3_controllers/ConfigurationService";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import type { MiroirTestExecutionEnvironment } from "./MiroirTestTools";

export const REPORT_TEST_NO_RUNNER_MESSAGE = "reportTest requires a registered report test runner";

export const REPORT_TEST_NO_SUITE_MESSAGE = "reportTest must be a leaf of a reportTestSuite";

// ################################################################################################
/**
 * `reportTest` leaf (#330). miroir-core cannot render React, so the leaf is run by the runner
 * registered through `ConfigurationService.registerReportTestRunner`, against the integration
 * session of the run (`executionEnvironment`).
 *
 * - No runner registered: the leaf is recorded as skipped and nothing is thrown.
 * - A leaf outside a `reportTestSuite` (no suite context from the walk) is recorded as an `error`
 *   and does not reach the runner.
 * - Otherwise the runner is called with the leaf and the suite context built by the walk, and its
 *   `ok` / `error` is recorded; an `error` then fails the vitest test, as a `runnerTest` does. A
 *   `skipped` result is recorded as skipped, with the runner's reason.
 */
export async function runMiroirReportTest(
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: MiroirTestRunFilter | undefined,
  miroirTest: MiroirTestForReport,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  executionEnvironment: MiroirTestExecutionEnvironment,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
  reportTestSuite?: ReportTestSuiteContext,
): Promise<void> {
  if (!localVitest.expect) {
    throw new Error("runMiroirReportTest called without vitest.expect");
  }
  const assertionName = miroirTest.miroirTestLabel;
  const currentTestAssertionPath =
    testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
  if (!currentTestAssertionPath) {
    throw new Error(
      "runMiroirReportTest called without testAssertionPath and no currentTestAssertionPath available",
    );
  }

  const excludedByFilter =
    Array.isArray(filter?.testList) && !(filter.testList as string[]).includes(assertionName);
  if (parentSkip || miroirTest.skip || excludedByFilter) {
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
    });
    return;
  }

  const runner = ConfigurationService.configurationService.reportTestRunner;
  if (!runner) {
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
      assertionActualValue: REPORT_TEST_NO_RUNNER_MESSAGE,
    });
    return;
  }

  let runnerResult: ReportTestRunnerResult;
  if (!reportTestSuite) {
    runnerResult = {
      status: "error",
      message: `${REPORT_TEST_NO_SUITE_MESSAGE} ("${assertionName}" is not)`,
    };
  } else {
    try {
      runnerResult = await runner({
        testNamePath,
        leaf: miroirTest,
        suite: reportTestSuite,
        executionEnvironment,
      });
    } catch (error) {
      runnerResult = {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  if (runnerResult.status === "skipped") {
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
      assertionActualValue: runnerResult.message,
    });
    return;
  }

  const testAssertionResult: TestAssertionResult =
    runnerResult.status === "ok"
      ? { assertionName, assertionResult: "ok" }
      : {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: runnerResult.expected,
          assertionActualValue:
            runnerResult.actual === undefined
              ? runnerResult.message
              : { message: runnerResult.message, actual: runnerResult.actual },
        };
  miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);

  localVitest
    .expect(
      runnerResult.status,
      runnerResult.status === "error"
        ? `reportTest "${MiroirActivityTracker.testPathName(testNamePath)}" failed: ${runnerResult.message}`
        : undefined,
    )
    .toBe("ok");
}

// ################################################################################################
// Action and assertion steps of a `reportTest` leaf (#330, analysis T6 / T7).
// ################################################################################################

/** Endpoint of `compositeActionSequence`. */
const COMPOSITE_ACTION_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";

/** What the action and assertion steps of one `reportTest` leaf share. */
export interface ReportTestActionContext {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  modelEnvironment: MiroirModelEnvironment;
  /** The session's test parameters (`runnerTestContext.testParams`). */
  testParams: Record<string, unknown>;
  /** The values kept by the leaf's `compositeAction` steps, by name. Filled by the steps. */
  results: Record<string, unknown>;
  /** The tracker of the session's DomainController, where assertions record their results. */
  miroirActivityTracker: MiroirActivityTrackerInterface;
}

function actionErrorMessage(result: Action2ReturnType | undefined): string {
  if (result instanceof Action2Error) {
    return `${result.errorType}: ${result.errorMessage ?? ""}`;
  }
  return `status ${JSON.stringify(result?.status)}`;
}

/** Runs a one-action sequence with the leaf's parameters: test parameters, then kept results. */
async function runOneActionSequence(
  context: ReportTestActionContext,
  actionLabel: string,
  action: unknown,
): Promise<Action2ReturnType> {
  return context.domainController.handleCompositeAction(
    {
      actionType: "compositeActionSequence",
      actionLabel,
      endpoint: COMPOSITE_ACTION_ENDPOINT,
      payload: { actionSequence: [action as any] },
    },
    context.applicationDeploymentMap,
    context.modelEnvironment,
    { ...context.testParams, ...context.results },
  );
}

/**
 * `compositeAction`: resolves the action's build templates with the test parameters and the kept
 * results, runs it through the session's DomainController, and keeps its returned value under
 * the step's `nameGivenToResult`, or the action's (a query has one). A failed action, or a query
 * returning a failure, is an `error` outcome.
 */
export async function runReportTestCompositeActionStep(
  context: ReportTestActionContext,
  step: ReportTestCompositeActionStep,
): Promise<ReportTestRunnerResult> {
  const actionLabel =
    step.label ??
    (typeof step.action.actionLabel === "string" ? step.action.actionLabel : step.action.actionType);
  const resolved = resolveCompositeActionTemplate(
    {
      actionType: "compositeActionSequence",
      actionLabel,
      endpoint: COMPOSITE_ACTION_ENDPOINT,
      payload: { actionSequence: [step.action] },
    } as CompositeActionTemplate,
    context.modelEnvironment,
    { ...context.testParams, ...context.results },
  );
  if (resolved instanceof TransformerFailure) {
    return { status: "error", message: `could not resolve the action: ${resolved.failureMessage}` };
  }
  const [resolvedAction] = resolved.resolvedCompositeActionDefinition.payload.actionSequence;
  const result = await runOneActionSequence(context, actionLabel, resolvedAction);
  if (result instanceof Action2Error || result?.status !== "ok") {
    return { status: "error", message: `the action failed: ${actionErrorMessage(result)}` };
  }
  if (result.returnedDomainElement instanceof Domain2ElementFailed) {
    return {
      status: "error",
      message: `the query failed: ${JSON.stringify(result.returnedDomainElement)}`,
    };
  }
  const nameGivenToResult =
    step.nameGivenToResult ?? (step.action as { nameGivenToResult?: string }).nameGivenToResult;
  if (nameGivenToResult !== undefined) {
    context.results[nameGivenToResult] = result.returnedDomainElement;
  }
  return { status: "ok" };
}

/**
 * The result recorded for `assertionName` in the test that is running, if any, at the tracker's
 * current path, where the DomainController records it (`getTestAssertionsResults` throws on a
 * suite with no result yet, hence the walk).
 */
function trackedAssertionOfCurrentTest(
  tracker: MiroirActivityTrackerInterface,
  assertionName: string,
): TestAssertionResult | undefined {
  let suiteResult: TestSuiteResult | undefined = tracker.getTestAssertionsResults([]);
  for (const element of tracker.getCurrentTestAssertionPath()) {
    if (element.testSuite !== undefined) {
      suiteResult = suiteResult?.testsSuiteResults?.[element.testSuite];
    } else if (element.test !== undefined) {
      return suiteResult?.testsResults?.[element.test]?.testAssertionsResults?.[assertionName];
    }
  }
  return undefined;
}

/**
 * `expectActionResult`: runs the assertion over the test parameters and the kept results, as the
 * assertions of a Runner test run (same ignored attributes, `resultAccessPath`,
 * `resultTransformer`). The DomainController records the assertion in the running test; a failed
 * one is an `error` outcome with its expected and actual values.
 */
export async function runReportTestExpectActionResultStep(
  context: ReportTestActionContext,
  step: ReportTestExpectActionResultStep,
): Promise<ReportTestRunnerResult> {
  const assertionName = step.assertion.testAssertion.testLabel;
  const previous = trackedAssertionOfCurrentTest(context.miroirActivityTracker, assertionName);
  const result = await runOneActionSequence(
    context,
    step.label ?? step.assertion.actionLabel ?? assertionName,
    step.assertion,
  );
  if (result instanceof Action2Error || result?.status !== "ok") {
    return { status: "error", message: `the assertion could not run: ${actionErrorMessage(result)}` };
  }
  const tracked = trackedAssertionOfCurrentTest(context.miroirActivityTracker, assertionName);
  // each run records a new object: the same one means this assertion recorded nothing
  if (tracked === undefined || tracked === previous) {
    return { status: "error", message: `the assertion "${assertionName}" recorded no result` };
  }
  if (tracked.assertionResult === "error") {
    return {
      status: "error",
      message: `assertion "${assertionName}" failed`,
      expected: tracked.assertionExpectedValue,
      actual: tracked.assertionActualValue,
    };
  }
  return { status: "ok" };
}

// ################################################################################################
// Stored values in the UI steps of a `reportTest` leaf (#333).
// ################################################################################################

/** `T` without its stored value references: the type of a UI step once they are resolved. */
export type WithoutStoredValueReferences<T> = 0 extends 1 & T
  ? T // any
  : T extends CoreTransformerForBuildPlusRuntime_getFromContext
    ? never
    : T extends readonly (infer Item)[]
      ? WithoutStoredValueReferences<Item>[]
      : T extends object
        ? { [K in keyof T]: WithoutStoredValueReferences<T[K]> }
        : T;

/** A UI step of a `reportTest` (or a `reactComponentTest`), its stored value references resolved. */
export type ResolvedReactComponentTestStep = WithoutStoredValueReferences<ReactComponentTestStep>;

/** A target of a resolved UI step. */
export type ResolvedReactComponentTestTarget = WithoutStoredValueReferences<ReactComponentTestTarget>;

function isStoredValueReference(value: unknown): value is CoreTransformerForBuildPlusRuntime_getFromContext {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as { transformerType?: unknown }).transformerType === "getFromContext"
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function kindOf(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }
  return Array.isArray(value) ? "an array" : typeof value === "object" ? "an object" : `a ${typeof value}`;
}

function isScalar(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function storedNames(value: unknown): string {
  const names = isPlainObject(value) ? Object.keys(value).sort() : [];
  return names.length > 0 ? names.join(", ") : "none";
}

/** The value of `reference` in `storedValues`; throws naming what is missing. */
function storedValueOf(
  reference: CoreTransformerForBuildPlusRuntime_getFromContext,
  storedValues: Record<string, unknown>,
): unknown {
  const path =
    reference.referencePath ?? (reference.referenceName !== undefined ? [reference.referenceName] : undefined);
  if (!path || path.length === 0) {
    throw new Error("a getFromContext reference needs referenceName or referencePath");
  }
  let current: unknown = storedValues;
  for (const [index, segment] of path.entries()) {
    if (!isPlainObject(current) && !Array.isArray(current)) {
      throw new Error(
        `no stored value at "${path.join(".")}": "${path.slice(0, index).join(".")}" is ${JSON.stringify(current)}`,
      );
    }
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      if (index === 0) {
        throw new Error(`no stored value "${segment}" (stored: ${storedNames(current)})`);
      }
      throw new Error(
        `no stored value at "${path.join(".")}": "${path.slice(0, index).join(".")}" has no "${segment}" (has: ${storedNames(current)})`,
      );
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** The step fields of type `string` that accept a reference, by step kind (#333). */
const stringOnlyStepFields: Record<string, readonly string[]> = {
  type: ["text"],
  filterSelect: ["text"],
  selectOption: ["option"],
  renameRecordEntry: ["newName"],
  waitForAttribute: ["value"],
};

/** Whether the field at `fieldPath` of a `stepKind` step takes a string only. */
function isStringOnlyField(stepKind: string, fieldPath: readonly (string | number)[]): boolean {
  if (fieldPath.length === 1) {
    return stringOnlyStepFields[stepKind]?.includes(String(fieldPath[0])) ?? false;
  }
  // `byTestId` of a target (`target`, `parentContains`)
  return fieldPath.length === 2 && fieldPath[1] === "byTestId";
}

/**
 * `step` with each `getFromContext` reference replaced by its value in `storedValues` (#333): the
 * test parameters and the values kept by the earlier `compositeAction` steps of the leaf.
 *
 * - A reference reads `referenceName`, or follows `referencePath`; `interpolation` is ignored,
 *   the reference is resolved when the step runs.
 * - In `expectedValue` (of `expectRenderedValues`), a reference resolves to any value. In
 *   `uploadFile.content`, to any JSON value, uploaded as its JSON text unless it is a string. A
 *   reference standing for the whole of `expectElement.values` resolves to an array of strings,
 *   numbers or booleans.
 * - Elsewhere, a reference must resolve to a string, a number or a boolean; a field that takes a
 *   string only gets a number or a boolean as text.
 * - An unresolved reference throws, naming the step field and what is missing.
 */
export function resolveReportTestStepReferences(
  step: ReactComponentTestStep,
  storedValues: Record<string, unknown>,
): ResolvedReactComponentTestStep {
  const resolve = (value: unknown, fieldPath: readonly (string | number)[]): unknown => {
    if (isStoredValueReference(value)) {
      const field = fieldPath.join(".");
      let stored: unknown;
      try {
        stored = storedValueOf(value, storedValues);
      } catch (error) {
        throw new Error(`${field}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
      const path = value.referencePath?.join(".") ?? value.referenceName;
      const wrongValue = (found: string, expected: string) =>
        new Error(`${field}: the stored value "${path}" ${found}, expected ${expected}`);
      if (fieldPath[0] === "expectedValue") {
        return stored;
      }
      const singleField = fieldPath.length === 1 ? fieldPath[0] : undefined;
      if (step.step === "uploadFile" && singleField === "content") {
        // the content of the file: a string as is, any other JSON value as its JSON text
        if (stored === undefined) {
          throw wrongValue("is undefined", "a JSON value");
        }
        return typeof stored === "string" ? stored : JSON.stringify(stored);
      }
      if (step.step === "expectElement" && singleField === "values") {
        // the whole list of values
        if (!Array.isArray(stored)) {
          throw wrongValue(`is ${kindOf(stored)}`, "an array of strings, numbers or booleans");
        }
        const index = stored.findIndex((item) => !isScalar(item));
        if (index >= 0) {
          throw wrongValue(
            `holds ${kindOf(stored[index])} at index ${index}`,
            "an array of strings, numbers or booleans",
          );
        }
        return stored;
      }
      if (!isScalar(stored)) {
        throw wrongValue(`is ${kindOf(stored)}`, "a string, a number or a boolean");
      }
      // a field that takes a string only receives a stored number or boolean as its text
      return isStringOnlyField(step.step, fieldPath) ? String(stored) : stored;
    }
    if (Array.isArray(value)) {
      return value.map((item, index) => resolve(item, [...fieldPath, index]));
    }
    if (isPlainObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, resolve(item, [...fieldPath, key])]),
      );
    }
    return value;
  };
  return resolve(step, []) as ResolvedReactComponentTestStep;
}
