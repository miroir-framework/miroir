/**
 * #252 Slice 6 — runner_freeze_application_version inline appForTest playfield (D12, no config uuid).
 * Vitest: host helper + real Miroir suite JSON (not reachable as a MiroirTest leaf).
 */
import { describe, expect, it } from "vitest";

import type {
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolveSuitePlayfieldSeed } from "../../../../src/5_tests/resolveSuitePlayfieldSeed.js";
import { miroirTest_runner_freeze_application_version } from "miroir-test-app_deployment-miroir";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase6" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase6.unit.test" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252";

const APP_FOR_TEST_UUID = "eef01001-0001-4000-8000-000000000001";
const APP_FOR_TEST_VERSION_UUID = "eef01001-0005-4000-8000-000000000005";
const PUBLISHER_UUID = "a027c379-8468-43a5-ba4d-bf618be25cab";
const COUNTRY_UUID = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";
const RESERVED_UNUSED_CONFIG_UUID = "343d4d68-b7db-4c19-a7e1-9b58e8428d52";

function suiteDefinition(instance: unknown): MiroirTestSuite {
  return (instance as MiroirTestDefinition).definition;
}

function playfieldFieldsOn(definition: MiroirTestSuite): string[] {
  return (["testbedModel", "testbedEntitiesAndInstances", "testConfiguration"] as const).filter(
    (field) => field in definition,
  );
}

(shouldRun ? describe : describe.skip)(
  "freeze suite inline appForTest playfield (issue #252 slice 6)",
  () => {
    it("runner_freeze_application_version JSON has inline playfield and no testConfiguration", () => {
      const suite = suiteDefinition(miroirTest_runner_freeze_application_version);
      expect(playfieldFieldsOn(suite)).toEqual(["testbedModel", "testbedEntitiesAndInstances"]);
      expect(suite.testConfiguration).toBeUndefined();
      expect(suite.testConfiguration).not.toBe(RESERVED_UNUSED_CONFIG_UUID);
    });

    it("resolveSuitePlayfieldSeed returns the appForTest Publisher+Country slice without a loader", () => {
      const suite = suiteDefinition(miroirTest_runner_freeze_application_version);
      const seed = resolveSuitePlayfieldSeed(suite);
      expect(seed).not.toBeNull();
      if (seed === null) {
        return;
      }
      expect(seed.testbedModel.applicationUuid).toBe(APP_FOR_TEST_UUID);
      expect(seed.testbedModel.applicationName).toBe("appForTest");
      expect((seed.testbedModel.entities ?? []).map((entity) => entity.uuid)).toEqual([
        PUBLISHER_UUID,
        COUNTRY_UUID,
      ]);
      expect((seed.testbedModel.applications ?? []).map((application) => application.uuid)).toEqual(
        [APP_FOR_TEST_UUID],
      );
      expect(
        (seed.testbedModel.applicationVersions ?? []).map((version) => version.uuid),
      ).toEqual([APP_FOR_TEST_VERSION_UUID]);
      expect(seed.testbedModel.reports).toBeUndefined();
      expect(seed.testbedModel.menus).toBeUndefined();
      expect(seed.testbedModel.endpoints).toBeUndefined();
      expect(seed.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid)).toEqual([
        PUBLISHER_UUID,
        COUNTRY_UUID,
      ]);
      expect(seed.testbedEntitiesAndInstances.map((entry) => entry.instances.length)).toEqual([
        3, 3,
      ]);
    });
  },
);
