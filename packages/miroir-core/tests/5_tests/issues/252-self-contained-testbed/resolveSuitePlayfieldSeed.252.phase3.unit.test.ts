/**
 * #252 Slice 3 — Library document TestConfiguration; lend/return resolve by uuid.
 * Vitest: host helper + real Library assets (not reachable as a MiroirTest leaf).
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
  miroirTest_runner_lend_document,
  miroirTest_runner_return_document,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase3" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase3.unit.test" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252";

const ENTITY_UUID = "675ccd46-7dd3-400b-a2bd-1319c39e11da";
const CONFIG_UUID = "d669558c-7cda-4037-81bf-0b9a71fbcb94";
const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";

const AUTHOR_UUID = "d7a144ff-d1b9-4135-800c-a7cfc1f38733";
const BOOK_UUID = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
const PUBLISHER_UUID = "a027c379-8468-43a5-ba4d-bf618be25cab";
const USER_UUID = "ca794e28-b2dc-45b3-8137-00151557eea8";
const COUNTRY_UUID = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";
const LENDING_HISTORY_ITEM_UUID = "e81078f3-2de7-4301-bd79-d3a156aec149";
const LENDING_ENDPOINT_UUID = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";
const BOOK_ENDPOINT_UUID = "9884c1a4-5122-488a-85db-a99fbc02e678";

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");
const CONFIG_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-library/assets/library_model",
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

function loadLibraryDocumentConfig(): TestConfigurationPlayfield {
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
  "Library document TestConfiguration (issue #252 slice 3)",
  () => {
    it("instance lives under library_model TestConfiguration with Library selfApplication", () => {
      const row = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as {
        uuid?: string;
        parentUuid?: string;
        selfApplication?: string;
        name?: string;
      };
      expect(row.uuid).toBe(CONFIG_UUID);
      expect(row.parentUuid).toBe(ENTITY_UUID);
      expect(row.selfApplication).toBe(LIBRARY_APPLICATION_UUID);
      expect(row.selfApplication).toBe(selfApplicationLibrary.uuid);
      expect(getApplicationSection(LIBRARY_APPLICATION_UUID, ENTITY_UUID)).toBe("model");
    });

    it("lend and return suite JSON reference the uuid and have no inline playfield", () => {
      for (const instance of [miroirTest_runner_lend_document, miroirTest_runner_return_document]) {
        const suite = suiteDefinition(instance);
        expect(playfieldFieldsOn(suite), suite.miroirTestLabel).toEqual(["testConfiguration"]);
        expect(suite.testConfiguration).toBe(CONFIG_UUID);
      }
    });

    it("resolveSuitePlayfieldSeed for lend and return equals the Library instance payload", () => {
      const loaded = loadLibraryDocumentConfig();
      const getTestConfiguration = (uuid: string) =>
        uuid === CONFIG_UUID ? loaded : undefined;

      const entityUuids = loaded.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid);
      expect(entityUuids).toEqual([AUTHOR_UUID, BOOK_UUID, PUBLISHER_UUID, USER_UUID]);
      expect(loaded.testbedEntitiesAndInstances.map((entry) => entry.instances.length)).toEqual([
        3, 6, 3, 1,
      ]);
      expect(loaded.testbedModel.applicationUuid).toBe(LIBRARY_APPLICATION_UUID);
      expect(loaded.testbedModel.applicationName).toBe("Library");
      expect((loaded.testbedModel.entities ?? []).map((entity) => entity.uuid)).toEqual([
        AUTHOR_UUID,
        BOOK_UUID,
        COUNTRY_UUID,
        LENDING_HISTORY_ITEM_UUID,
        PUBLISHER_UUID,
        USER_UUID,
      ]);
      expect((loaded.testbedModel.endpoints ?? []).map((endpoint) => endpoint.uuid)).toEqual([
        BOOK_ENDPOINT_UUID,
        LENDING_ENDPOINT_UUID,
      ]);

      for (const instance of [miroirTest_runner_lend_document, miroirTest_runner_return_document]) {
        const suite = suiteDefinition(instance);
        expect(resolveSuitePlayfieldSeed(suite, getTestConfiguration), suite.miroirTestLabel).toEqual({
          testbedModel: loaded.testbedModel,
          testbedEntitiesAndInstances: loaded.testbedEntitiesAndInstances,
        });
      }
    });
  },
);
