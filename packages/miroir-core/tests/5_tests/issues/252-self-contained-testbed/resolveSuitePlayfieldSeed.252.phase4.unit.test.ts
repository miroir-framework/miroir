/**
 * #252 Slice 4 — Miroir Publisher+Country TestConfiguration; three suites resolve by uuid.
 * Vitest: host helper + real Miroir assets (not reachable as a MiroirTest leaf).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getApplicationSection } from "../../../../src/1_core/Model.js";
import {
  resolveSuitePlayfieldSeed,
  type TestConfigurationPlayfield,
} from "../../../../src/5_tests/resolveSuitePlayfieldSeed.js";
import {
  miroirTest_domain_controller_application_version_freeze,
  miroirTest_domain_controller_model_crud,
  miroirTest_evolutionTraceWP1,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase4" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase4.unit.test" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252";

const ENTITY_UUID = "675ccd46-7dd3-400b-a2bd-1319c39e11da";
const CONFIG_UUID = "431e0903-80ff-45be-aec7-12fe272dcef0";
const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const PUBLISHER_UUID = "a027c379-8468-43a5-ba4d-bf618be25cab";
const COUNTRY_UUID = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";

const SUITE_INSTANCES = [
  miroirTest_domain_controller_model_crud,
  miroirTest_domain_controller_application_version_freeze,
  miroirTest_evolutionTraceWP1,
];

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");
const CONFIG_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  ENTITY_UUID,
  `${CONFIG_UUID}.json`,
);

function suiteDefinition(instance: unknown): MiroirTestSuite {
  return (instance as MiroirTestDefinition).definition;
}

function playfieldFieldsOn(definition: MiroirTestSuite): string[] {
  return (["testbedModel", "testbedEntitiesAndInstances", "testConfiguration"] as const).filter(
    (field) => field in definition,
  );
}

function loadPublisherAndCountryConfig(): TestConfigurationPlayfield {
  const row = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as TestConfigurationPlayfield & {
    selfApplication?: string;
    parentUuid?: string;
  };
  return {
    uuid: row.uuid,
    testbedModel: row.testbedModel,
    testbedEntitiesAndInstances: row.testbedEntitiesAndInstances,
  };
}

(shouldRun ? describe : describe.skip)(
  "Miroir Publisher+Country TestConfiguration (issue #252 slice 4)",
  () => {
    it("instance lives under miroir_data TestConfiguration with Miroir selfApplication", () => {
      const row = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as {
        uuid?: string;
        parentUuid?: string;
        selfApplication?: string;
        name?: string;
      };
      expect(row.uuid).toBe(CONFIG_UUID);
      expect(row.parentUuid).toBe(ENTITY_UUID);
      expect(row.selfApplication).toBe(MIROIR_APPLICATION_UUID);
      expect(row.selfApplication).toBe(selfApplicationMiroir.uuid);
      expect(getApplicationSection(MIROIR_APPLICATION_UUID, ENTITY_UUID)).toBe("data");
    });

    it("model_crud, freeze, and evolutionTraceWP1 suite JSON reference the uuid and have no inline playfield", () => {
      for (const instance of SUITE_INSTANCES) {
        const suite = suiteDefinition(instance);
        expect(playfieldFieldsOn(suite), suite.miroirTestLabel).toEqual(["testConfiguration"]);
        expect(suite.testConfiguration).toBe(CONFIG_UUID);
      }
    });

    it("resolveSuitePlayfieldSeed for the three suites equals the Miroir instance payload", () => {
      const loaded = loadPublisherAndCountryConfig();
      const getTestConfiguration = (uuid: string) =>
        uuid === CONFIG_UUID ? loaded : undefined;

      const entityUuids = loaded.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid);
      expect(entityUuids).toEqual([PUBLISHER_UUID, COUNTRY_UUID]);
      expect(loaded.testbedEntitiesAndInstances.map((entry) => entry.instances.length)).toEqual([
        3, 3,
      ]);
      expect(loaded.testbedModel.applicationUuid).toBe(LIBRARY_APPLICATION_UUID);
      expect(loaded.testbedModel.applicationName).toBe("Library");
      expect((loaded.testbedModel.entities ?? []).map((entity) => entity.uuid)).toEqual([
        PUBLISHER_UUID,
        COUNTRY_UUID,
      ]);

      for (const instance of SUITE_INSTANCES) {
        const suite = suiteDefinition(instance);
        expect(resolveSuitePlayfieldSeed(suite, getTestConfiguration), suite.miroirTestLabel).toEqual(
          {
            testbedModel: loaded.testbedModel,
            testbedEntitiesAndInstances: loaded.testbedEntitiesAndInstances,
          },
        );
      }
    });
  },
);
