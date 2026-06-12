import * as vitest from "vitest";

import type {
  MiroirTestForFunctionCall,
  TestAssertionResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import { jsonify } from "../1_core/test-expect";
import { Action2Error, TransformerFailure } from "../0_interfaces/2_domain/DomainElement";
import { resolvePathOnObject } from "../tools";
import { ignorePostgresExtraAttributes, removeUndefinedProperties, unNullify } from "../4_services/otherTools";
import {
  resolveFixtureProperty,
  resolveFunctionCallEnvironment,
  resolveFunctionCallFixture,
} from "./FunctionCallTestFixtures";
import { resolveFunctionCallTarget } from "./FunctionCallTestRegistry";
import type { TestSuiteListFilter } from "../0_interfaces/5-tests/miroirTestTypes";

const JSON_UNDEFINED_SENTINEL = "__miroirJsonUndefined";
const JSON_FIXTURE_REF_SENTINEL = "__fixtureRef";
const JSON_SET_SENTINEL = "__miroirJsonSet";
const JSON_MATCH_PATTERN_SENTINEL = "__miroirMatchPattern";
const JSON_ENVIRONMENT_REF_SENTINEL = "__miroirEnvironmentRef";

type VitestNamespace = typeof vitest;

function resolveFixtureSentinel(value: Record<string, unknown>): unknown {
  const fixtureRef = value[JSON_FIXTURE_REF_SENTINEL];
  if (typeof fixtureRef !== "string") {
    throw new Error("functionCallTest __fixtureRef sentinel requires a string fixtureRef");
  }
  const fixture = resolveFunctionCallFixture(fixtureRef);
  const fixtureProperty =
    typeof value.__fixtureProperty === "string" ? value.__fixtureProperty : undefined;
  return resolveFixtureProperty(fixture, fixtureProperty);
}

/** Deserialize functionCallTest arguments / expected values from store JSON. */
export function deserializeFunctionCallValue(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON_UNDEFINED_SENTINEL in (value as Record<string, unknown>) &&
    (value as Record<string, unknown>)[JSON_UNDEFINED_SENTINEL] === true
  ) {
    return undefined;
  }
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON_SET_SENTINEL in (value as Record<string, unknown>)
  ) {
    const items = (value as Record<string, unknown>)[JSON_SET_SENTINEL];
    return new Set(
      Array.isArray(items) ? items.map((item) => deserializeFunctionCallValue(item)) : [],
    );
  }
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON_ENVIRONMENT_REF_SENTINEL in (value as Record<string, unknown>)
  ) {
    const environmentRef = (value as Record<string, unknown>)[JSON_ENVIRONMENT_REF_SENTINEL];
    if (typeof environmentRef !== "string") {
      throw new Error("functionCallTest __miroirEnvironmentRef sentinel requires a string ref");
    }
    const environment = resolveFunctionCallEnvironment(environmentRef);
    if (!environment) {
      throw new Error(`Unknown functionCallTest environmentRef: ${environmentRef}`);
    }
    return environment;
  }
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON_FIXTURE_REF_SENTINEL in (value as Record<string, unknown>)
  ) {
    return resolveFixtureSentinel(value as Record<string, unknown>);
  }
  if (Array.isArray(value)) {
    return value.map(deserializeFunctionCallValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        deserializeFunctionCallValue(entry),
      ]),
    );
  }
  return value;
}

function injectAtIndex(args: unknown[], index: number, value: unknown): unknown[] {
  const next = [...args];
  next.splice(index, 0, value);
  return next;
}

export function prepareFunctionCallArguments(miroirTest: MiroirTestForFunctionCall): unknown[] {
  let args = (miroirTest.arguments ?? []).map(deserializeFunctionCallValue);

  if (miroirTest.fixtureRef) {
    const fixture = resolveFunctionCallFixture(miroirTest.fixtureRef);
    const fixtureValue = resolveFixtureProperty(fixture, miroirTest.fixtureProperty);
    const index = miroirTest.fixtureArgumentIndex ?? 0;
    args = [...args];
    args.splice(index, 0, fixtureValue);
  }

  const environment = resolveFunctionCallEnvironment(miroirTest.environmentRef);
  if (environment) {
    const index = miroirTest.environmentArgumentIndex ?? 1;
    args = injectAtIndex(args, index, environment);
  }

  return args;
}

function deepNormalizeSets(value: unknown): unknown {
  if (value instanceof Set) {
    return Array.from(value)
      .map(deepNormalizeSets)
      .sort((a, b) => String(a).localeCompare(String(b)));
  }
  if (Array.isArray(value)) {
    return value.map(deepNormalizeSets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        deepNormalizeSets(entry),
      ]),
    );
  }
  return value;
}

function normalizeFunctionCallResult(rawResult: unknown, ignoreAttributes: string[] | undefined) {
  if (rawResult instanceof Action2Error) {
    return {
      errorType: rawResult.errorType,
      errorMessage: rawResult.errorMessage,
    };
  }
  const resultForNormalize = deepNormalizeSets(rawResult);
  const resultWithIgnored = ignorePostgresExtraAttributes(resultForNormalize, ignoreAttributes);
  const jsonifiedResult = jsonify(resultWithIgnored);
  return removeUndefinedProperties(unNullify(jsonifiedResult));
}

function normalizeExpectedFunctionCallValue(expectedValue: unknown): unknown {
  const deserialized = deserializeFunctionCallValue(expectedValue);
  if (deserialized === null) {
    return null;
  }
  return removeUndefinedProperties(unNullify(deepNormalizeSets(deserialized)));
}

function assertFunctionCallResult(
  localVitest: VitestNamespace,
  testSuiteNamePathAsString: string,
  assertionName: string,
  actualValue: unknown,
  expectedValue: unknown,
  ignoreAttributes: string[] | undefined,
): boolean {
  const normalizedActual = normalizeFunctionCallResult(actualValue, ignoreAttributes);
  const deserializedExpected = deserializeFunctionCallValue(expectedValue);
  if (
    deserializedExpected &&
    typeof deserializedExpected === "object" &&
    JSON_MATCH_PATTERN_SENTINEL in (deserializedExpected as Record<string, unknown>)
  ) {
    const pattern = (deserializedExpected as Record<string, unknown>)[JSON_MATCH_PATTERN_SENTINEL];
    const testResult: any = localVitest
      .expect(String(normalizedActual), `${testSuiteNamePathAsString} > ${assertionName}`)
      .toMatch(new RegExp(String(pattern)));
    return !testResult || !Object.hasOwn(testResult, "result") || !!testResult.result;
  }
  const normalizedExpected = normalizeExpectedFunctionCallValue(deserializedExpected);
  const testResult: any = localVitest
    .expect(normalizedActual, `${testSuiteNamePathAsString} > ${assertionName}`)
    .toEqual(normalizedExpected);
  return !testResult || !Object.hasOwn(testResult, "result") || !!testResult.result;
}

export async function runMiroirFunctionCallTestInMemory(
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: { testList?: TestSuiteListFilter; match?: RegExp } | undefined,
  miroirTest: MiroirTestForFunctionCall,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
): Promise<void> {
  const assertionName = miroirTest.miroirTestLabel;
  const effectiveSkip = !!(parentSkip || miroirTest.skip);

  const currentTestAssertionPath =
    testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
  if (!currentTestAssertionPath) {
    throw new Error(
      "runMiroirFunctionCallTestInMemory called without testAssertionPath and no currentTestAssertionPath available",
    );
  }

  if (
    effectiveSkip ||
    (filter?.testList && !(filter.testList as string[]).includes(assertionName))
  ) {
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
    });
    return;
  }

  const fn = resolveFunctionCallTarget(miroirTest.functionRef);
  const args = prepareFunctionCallArguments(miroirTest);
  const testSuiteNamePathAsString = MiroirActivityTracker.testPathName(testNamePath);

  let testAssertionResult: TestAssertionResult;

  try {
    if (miroirTest.expectedError) {
      const throwFn = () => fn(...args);
      let testAssertionResultForThrow: TestAssertionResult | undefined;
      try {
        throwFn();
        testAssertionResultForThrow = {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: miroirTest.expectedError,
        };
      } catch (error) {
        const matchesMessage =
          error instanceof Error && error.message.includes(miroirTest.expectedError);
        const matchesTransformerFailure =
          error instanceof TransformerFailure &&
          error.queryFailure === miroirTest.expectedError;
        if (matchesMessage || matchesTransformerFailure) {
          testAssertionResultForThrow = { assertionName, assertionResult: "ok" };
        } else {
          testAssertionResultForThrow = {
            assertionName,
            assertionResult: "error",
            assertionExpectedValue: miroirTest.expectedError,
            assertionActualValue: normalizeFunctionCallResult(error, miroirTest.ignoreAttributes),
          };
        }
      }
      testAssertionResult = testAssertionResultForThrow;
    } else if (miroirTest.expectUndefinedResult) {
      const rawResult = fn(...args);
      const testResult: any = localVitest
        .expect(rawResult, `${testSuiteNamePathAsString} > ${assertionName}`)
        .toEqual(undefined);

      if (!testResult || !Object.hasOwn(testResult, "result")) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else if (testResult.result) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else {
        testAssertionResult = {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: undefined,
          assertionActualValue: jsonify(rawResult),
        };
      }
    } else if (miroirTest.expectedAction2ErrorType) {
      const rawResult = fn(...args);
      const isAction2Error =
        rawResult instanceof Action2Error &&
        rawResult.errorType === miroirTest.expectedAction2ErrorType;
      const testResult: any = localVitest
        .expect(isAction2Error, `${testSuiteNamePathAsString} > ${assertionName}`)
        .toBe(true);

      if (!testResult || !Object.hasOwn(testResult, "result")) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else if (testResult.result) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else {
        testAssertionResult = {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: miroirTest.expectedAction2ErrorType,
          assertionActualValue: normalizeFunctionCallResult(rawResult, miroirTest.ignoreAttributes),
        };
      }
    } else if (miroirTest.assertions?.length) {
      const rawResult = fn(...args);
      let allOk = true;
      let firstFailure: TestAssertionResult | undefined;

      for (const assertion of miroirTest.assertions) {
        const subName = `${assertionName} > ${assertion.label}`;
        const actualSlice = resolvePathOnObject(rawResult, assertion.resultAccessPath ?? []);
        const ok = assertFunctionCallResult(
          localVitest,
          testSuiteNamePathAsString,
          subName,
          actualSlice,
          assertion.expectedValue,
          miroirTest.ignoreAttributes,
        );
        if (!ok && !firstFailure) {
          firstFailure = {
            assertionName: subName,
            assertionResult: "error",
            assertionExpectedValue: assertion.expectedValue,
            assertionActualValue: normalizeFunctionCallResult(actualSlice, miroirTest.ignoreAttributes),
          };
        }
        allOk = allOk && ok;
      }

      testAssertionResult = allOk
        ? { assertionName, assertionResult: "ok" }
        : firstFailure ?? { assertionName, assertionResult: "error" };
    } else {
      const rawResult = fn(...args);
      const normalizedResult = normalizeFunctionCallResult(rawResult, miroirTest.ignoreAttributes);
      const normalizedExpected = normalizeExpectedFunctionCallValue(miroirTest.expectedValue);

      const testResult: any = localVitest
        .expect(normalizedResult, `${testSuiteNamePathAsString} > ${assertionName}`)
        .toEqual(normalizedExpected);

      if (!testResult || !Object.hasOwn(testResult, "result")) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else if (testResult.result) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else {
        testAssertionResult = {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: miroirTest.expectedValue,
          assertionActualValue: normalizedResult,
        };
      }
    }
  } catch {
    testAssertionResult = {
      assertionName,
      assertionResult: "error",
      assertionExpectedValue:
        miroirTest.expectedError ??
        miroirTest.expectedAction2ErrorType ??
        miroirTest.expectedValue,
    };
  }

  miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);
}

export {
  listFunctionCallEnvironmentRefs,
  listFunctionCallFixtureRefs,
  resolveFunctionCallEnvironment,
  resolveFunctionCallFixture,
} from "./FunctionCallTestFixtures";
export {
  listWhitelistedFunctionRefs,
  resolveFunctionCallTarget,
  type FunctionCallRef,
} from "./FunctionCallTestRegistry";
