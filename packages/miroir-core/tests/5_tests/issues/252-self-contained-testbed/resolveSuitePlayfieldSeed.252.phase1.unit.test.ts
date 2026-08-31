/**
 * #252 Slice 1 — resolve playfield model + instances from a MiroirTestSuite.
 */
import { describe, expect, it } from "vitest";

import type { MiroirTestDefinition, MiroirTestSuite } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  resolveSuitePlayfieldSeed,
  type TestConfigurationPlayfield,
} from "../../../../src/5_tests/resolveSuitePlayfieldSeed.js";
import {
  miroirTest_domain_controller_model_undo_redo,
  miroirTest_mustache,
  miroirTest_runner_create_entity,
} from "miroir-test-app_deployment-miroir";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase1" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase1.unit.test";

const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const CONFIG_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function suiteDefinition(instance: unknown): MiroirTestSuite {
  return (instance as MiroirTestDefinition).definition;
}

function minimalSuite(overrides: Record<string, unknown> = {}): MiroirTestSuite {
  return {
    miroirTestType: "miroirTestSuite",
    miroirTestLabel: "slice1.xor",
    miroirTests: [],
    ...overrides,
  } as MiroirTestSuite;
}

(shouldRun ? describe : describe.skip)(
  "resolveSuitePlayfieldSeed (issue #252 slice 1)",
  () => {
    it("returns null for skipRunTargetPlayfieldReset suites", () => {
      expect(resolveSuitePlayfieldSeed(suiteDefinition(miroirTest_runner_create_entity))).toBeNull();
    });

    it("returns inline testbedModel and empty instances from domain_controller_model_undo_redo", () => {
      const suite = suiteDefinition(miroirTest_domain_controller_model_undo_redo);
      expect(resolveSuitePlayfieldSeed(suite)).toEqual({
        testbedModel: {
          applicationUuid: LIBRARY_APPLICATION_UUID,
          applicationName: "Library",
        },
        testbedEntitiesAndInstances: [],
      });
    });

    it("throws when both testConfiguration and inline fields are set", () => {
      const suite = minimalSuite({
        testConfiguration: CONFIG_UUID,
        testbedModel: { applicationUuid: LIBRARY_APPLICATION_UUID, applicationName: "Library" },
        testbedEntitiesAndInstances: [],
      });
      expect(() => resolveSuitePlayfieldSeed(suite)).toThrow(/both testConfiguration and inline/i);
    });

    it("throws when testConfiguration is set but no loader is provided", () => {
      const suite = minimalSuite({ testConfiguration: CONFIG_UUID });
      expect(() => resolveSuitePlayfieldSeed(suite)).toThrow(/no loader/i);
    });

    it("throws when testConfiguration uuid is unknown to the loader", () => {
      const suite = minimalSuite({ testConfiguration: CONFIG_UUID });
      expect(() => resolveSuitePlayfieldSeed(suite, () => undefined)).toThrow(/unknown testConfiguration/i);
    });

    it("returns the loaded TestConfiguration payload for a uuid", () => {
      const loaded: TestConfigurationPlayfield = {
        uuid: CONFIG_UUID,
        testbedModel: { applicationUuid: LIBRARY_APPLICATION_UUID, applicationName: "Library" },
        testbedEntitiesAndInstances: [],
      };
      const suite = minimalSuite({ testConfiguration: CONFIG_UUID });
      expect(resolveSuitePlayfieldSeed(suite, (uuid) => (uuid === CONFIG_UUID ? loaded : undefined))).toEqual({
        testbedModel: loaded.testbedModel,
        testbedEntitiesAndInstances: loaded.testbedEntitiesAndInstances,
      });
    });

    it("returns null when the suite has neither uuid nor inline fields and is not skipReset", () => {
      expect(resolveSuitePlayfieldSeed(suiteDefinition(miroirTest_mustache))).toBeNull();
    });

    it("generated MiroirTestSuite accepts optional inline playfield fields", () => {
      const suite: MiroirTestSuite = {
        miroirTestType: "miroirTestSuite",
        miroirTestLabel: "slice1.schema",
        miroirTests: [],
        testbedModel: {
          applicationUuid: LIBRARY_APPLICATION_UUID,
          applicationName: "Library",
        },
        testbedEntitiesAndInstances: [],
      };
      expect(suite.testbedModel?.applicationName).toBe("Library");
      expect("testConfiguration" in suite).toBe(false);
    });
  },
);
