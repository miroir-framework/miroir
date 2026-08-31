/**
 * #252 Slice 5 — unique DC playfields inlined on suite JSON (not registry, not Library Entity rows).
 * Vitest: host helper + real Miroir suite assets (not reachable as a MiroirTest leaf).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { resolveSuitePlayfieldSeed } from "../../../../src/5_tests/resolveSuitePlayfieldSeed.js";
import {
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_no_parent_uuid_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
} from "miroir-test-app_deployment-miroir";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase5" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252.phase5.unit.test" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.252";

const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const AUTHOR_UUID = "d7a144ff-d1b9-4135-800c-a7cfc1f38733";
const BOOK_UUID = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
const PUBLISHER_UUID = "a027c379-8468-43a5-ba4d-bf618be25cab";
const COMPOSITE_PK_UUID = "44691d2c-d7c1-48e0-8363-71c51195e104";
const CODE_NUMBER_UUID = "4bbf4d19-7ac5-4fff-88ee-63ee49c7802f";
const NO_PARENT_UUID = "803b81ad-fda4-4206-8860-cc86f37c7a6e";
const BOOK3_UUID = "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7";

const SUITE_INSTANCES = [
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_no_parent_uuid_crud,
];

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");
const LIBRARY_ENTITY_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-library/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);

function suiteDefinition(instance: unknown): MiroirTestSuite {
  return (instance as MiroirTestDefinition).definition;
}

function playfieldFieldsOn(definition: MiroirTestSuite): string[] {
  return (["testbedModel", "testbedEntitiesAndInstances", "testConfiguration"] as const).filter(
    (field) => field in definition,
  );
}

(shouldRun ? describe : describe.skip)(
  "unique DC suite-owned inline playfields (issue #252 slice 5)",
  () => {
    it("five unique DC suite JSON files have inline playfield and no testConfiguration", () => {
      for (const instance of SUITE_INSTANCES) {
        const suite = suiteDefinition(instance);
        expect(playfieldFieldsOn(suite), suite.miroirTestLabel).toEqual([
          "testbedModel",
          "testbedEntitiesAndInstances",
        ]);
        expect(resolveSuitePlayfieldSeed(suite), suite.miroirTestLabel).toEqual({
          testbedModel: suite.testbedModel,
          testbedEntitiesAndInstances: suite.testbedEntitiesAndInstances,
        });
      }
    });

    it("data_crud inlines Author/Book/Publisher instances as a slice, not defaultLibraryAppModel", () => {
      const suite = suiteDefinition(miroirTest_domain_controller_data_crud);
      const seed = resolveSuitePlayfieldSeed(suite);
      expect(seed).not.toBeNull();
      if (seed === null) {
        return;
      }
      expect(seed.testbedModel.applicationUuid).toBe(LIBRARY_APPLICATION_UUID);
      expect(seed.testbedModel.applicationName).toBe("Library");
      expect((seed.testbedModel.entities ?? []).map((entity) => entity.uuid)).toEqual([
        AUTHOR_UUID,
        BOOK_UUID,
        PUBLISHER_UUID,
      ]);
      expect(seed.testbedModel.reports).toBeUndefined();
      expect(seed.testbedModel.menus).toBeUndefined();
      expect(seed.testbedModel.runners).toBeUndefined();
      expect(seed.testbedModel.endpoints).toBeUndefined();
      expect(seed.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid)).toEqual([
        AUTHOR_UUID,
        BOOK_UUID,
        PUBLISHER_UUID,
      ]);
      expect(seed.testbedEntitiesAndInstances.map((entry) => entry.instances.length)).toEqual([
        3, 5, 3,
      ]);
      const bookUuids = seed.testbedEntitiesAndInstances[1].instances.map(
        (instance) => (instance as { uuid?: string }).uuid,
      );
      expect(bookUuids).not.toContain(BOOK3_UUID);
    });

    it("composite / non-uuid / no-parent suites inline the synthetic entities and known instances", () => {
      const composite = resolveSuitePlayfieldSeed(
        suiteDefinition(miroirTest_domain_controller_composite_pk_crud),
      );
      expect(composite?.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid)).toEqual([
        COMPOSITE_PK_UUID,
      ]);
      expect(composite?.testbedEntitiesAndInstances[0].instances.map((row) => row.name)).toEqual([
        "EU-A1 item",
        "EU-B2 item",
        "US-A1 item",
      ]);
      expect((composite?.testbedModel.entities ?? []).map((entity) => entity.uuid)).toEqual([
        COMPOSITE_PK_UUID,
      ]);

      const nonUuidModel = resolveSuitePlayfieldSeed(
        suiteDefinition(miroirTest_domain_controller_non_uuid_pk_model_crud),
      );
      expect(nonUuidModel?.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid)).toEqual([
        PUBLISHER_UUID,
      ]);
      expect(nonUuidModel?.testbedEntitiesAndInstances[0].instances.length).toBe(3);
      expect((nonUuidModel?.testbedModel.entities ?? []).map((entity) => entity.uuid)).toEqual([
        PUBLISHER_UUID,
      ]);

      const nonUuidData = resolveSuitePlayfieldSeed(
        suiteDefinition(miroirTest_domain_controller_non_uuid_pk_data_crud),
      );
      expect(nonUuidData?.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid)).toEqual([
        CODE_NUMBER_UUID,
      ]);
      expect(
        nonUuidData?.testbedEntitiesAndInstances[0].instances.map(
          (row) => (row as { code?: number }).code,
        ),
      ).toEqual([1, 2, 3]);

      const noParent = resolveSuitePlayfieldSeed(
        suiteDefinition(miroirTest_domain_controller_no_parent_uuid_crud),
      );
      expect(noParent?.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid)).toEqual([
        PUBLISHER_UUID,
        NO_PARENT_UUID,
      ]);
      expect(noParent?.testbedEntitiesAndInstances.map((entry) => entry.instances.length)).toEqual([
        3, 3,
      ]);
      for (const instance of noParent?.testbedEntitiesAndInstances[1].instances ?? []) {
        expect("parentUuid" in instance).toBe(false);
      }
    });

    it("synthetic entity uuids are not Library Entity rows under library_model/16dbfe28", () => {
      const entityFiles = readdirSync(LIBRARY_ENTITY_DIR).filter((file) => file.endsWith(".json"));
      for (const uuid of [COMPOSITE_PK_UUID, CODE_NUMBER_UUID, NO_PARENT_UUID]) {
        expect(entityFiles, uuid).not.toContain(`${uuid}.json`);
      }
      for (const file of entityFiles) {
        const row = JSON.parse(readFileSync(join(LIBRARY_ENTITY_DIR, file), "utf8")) as {
          uuid?: string;
        };
        expect([COMPOSITE_PK_UUID, CODE_NUMBER_UUID, NO_PARENT_UUID]).not.toContain(row.uuid);
      }
    });
  },
);
