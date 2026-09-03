import { describe, expect, it } from "vitest";

import {
  resolveSuiteTestbedInitApplicationParameters,
  type TestbedInitApplicationParametersRef,
} from "../../src/5_tests/resolveSuiteTestbedInitApplicationParameters.js";
import type { InitApplicationParameters } from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { miroirTest_runner_create_entity } from "miroir-test-app_deployment-miroir";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "resolveSuiteTestbedInitApplicationParameters" ||
  RUN_TEST === "resolveSuiteTestbedInitApplicationParameters.unit.test";

const libraryInit = { dataStoreType: "app", tag: "library" } as InitApplicationParameters;
const appForTestInit = { dataStoreType: "app", tag: "appForTest" } as InitApplicationParameters;

function getInit(ref: TestbedInitApplicationParametersRef): InitApplicationParameters {
  if (ref === "libraryTestbedInitParams") return libraryInit;
  if (ref === "appForTestTestbedInitParams") return appForTestInit;
  throw new Error(`unexpected ref ${ref}`);
}

function suiteDefinition(overrides: Partial<MiroirTestSuite> = {}): MiroirTestSuite {
  return {
    miroirTestType: "miroirTestSuite",
    miroirTestLabel: "test.suite",
    miroirTests: [],
    ...overrides,
  };
}

(shouldRun ? describe : describe.skip)("resolveSuiteTestbedInitApplicationParameters", () => {
  it("returns null when skipRunTargetPlayfieldReset is set on runner leaves", () => {
    const suite = miroirTest_runner_create_entity.definition as MiroirTestSuite;
    expect(
      resolveSuiteTestbedInitApplicationParameters(suite, getInit),
    ).toBeNull();
  });

  it("resolves libraryTestbedInitParams ref via injected lookup", () => {
    const resolved = resolveSuiteTestbedInitApplicationParameters(
      suiteDefinition({ testbedInitApplicationParameters: "libraryTestbedInitParams" }),
      getInit,
    );
    expect(resolved).toBe(libraryInit);
  });

  it("resolves appForTestTestbedInitParams ref via injected lookup", () => {
    const resolved = resolveSuiteTestbedInitApplicationParameters(
      suiteDefinition({ testbedInitApplicationParameters: "appForTestTestbedInitParams" }),
      getInit,
    );
    expect(resolved).toBe(appForTestInit);
  });

  it("throws when init ref is missing on a non-skipReset suite", () => {
    expect(() =>
      resolveSuiteTestbedInitApplicationParameters(suiteDefinition(), getInit),
    ).toThrow(/missing testbedInitApplicationParameters/i);
  });
});
