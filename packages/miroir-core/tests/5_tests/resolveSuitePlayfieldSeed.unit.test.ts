/**
 * Resolve playfield model + instances from a MiroirTestSuite (inline XOR TestConfiguration).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getApplicationSection } from "../../src/1_core/Model.js";
import {
  resolveSuitePlayfieldSeed,
  type TestConfigurationPlayfield,
} from "../../src/5_tests/resolveSuitePlayfieldSeed.js";
import {
  miroirTest_domain_controller_application_version_freeze,
  miroirTest_domain_controller_composite_pk_crud,
  miroirTest_domain_controller_data_crud,
  miroirTest_domain_controller_model_crud,
  miroirTest_domain_controller_model_undo_redo,
  miroirTest_domain_controller_no_parent_uuid_crud,
  miroirTest_domain_controller_non_uuid_pk_data_crud,
  miroirTest_domain_controller_non_uuid_pk_model_crud,
  miroirTest_evolutionTraceWP1,
  miroirTest_mustache,
  miroirTest_runner_create_entity,
  miroirTest_runner_drop_entity,
  miroirTest_runner_freeze_application_version,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import {
  miroirTest_runner_lend_document,
  miroirTest_runner_return_document,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "resolveSuitePlayfieldSeed" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.unit.test" ||
  RUN_TEST === "resolveSuitePlayfieldSeed.unit.test.ts";

const LIBRARY_APPLICATION_UUID = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const MIROIR_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const SYNTHETIC_CONFIG_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const LIBRARY_DOCUMENT_CONFIG_UUID = "d669558c-7cda-4037-81bf-0b9a71fbcb94";
const MIROIR_PUBLISHER_COUNTRY_CONFIG_UUID = "431e0903-80ff-45be-aec7-12fe272dcef0";
const TEST_CONFIGURATION_ENTITY_UUID = "675ccd46-7dd3-400b-a2bd-1319c39e11da";
const AUTHOR_UUID = "d7a144ff-d1b9-4135-800c-a7cfc1f38733";
const BOOK_UUID = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
const PUBLISHER_UUID = "a027c379-8468-43a5-ba4d-bf618be25cab";
const USER_UUID = "ca794e28-b2dc-45b3-8137-00151557eea8";
const COUNTRY_UUID = "d3139a6d-0486-4ec8-bded-2a83a3c3cee4";
const LENDING_HISTORY_ITEM_UUID = "e81078f3-2de7-4301-bd79-d3a156aec149";
const LENDING_ENDPOINT_UUID = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";
const BOOK_ENDPOINT_UUID = "9884c1a4-5122-488a-85db-a99fbc02e678";
const COMPOSITE_PK_UUID = "44691d2c-d7c1-48e0-8363-71c51195e104";
const CODE_NUMBER_UUID = "4bbf4d19-7ac5-4fff-88ee-63ee49c7802f";
const NO_PARENT_UUID = "803b81ad-fda4-4206-8860-cc86f37c7a6e";
const BOOK3_UUID = "4cb917b3-3c53-4f9b-b000-b0e4c07a81f7";
const APP_FOR_TEST_UUID = "eef01001-0001-4000-8000-000000000001";
const APP_FOR_TEST_VERSION_UUID = "eef01001-0005-4000-8000-000000000005";
const RESERVED_UNUSED_CONFIG_UUID = "343d4d68-b7db-4c19-a7e1-9b58e8428d52";

const REPO_ROOT = join(import.meta.dirname, "../../../..");

function suiteDefinition(instance: unknown): MiroirTestSuite {
  return (instance as MiroirTestDefinition).definition;
}

function playfieldFieldsOn(definition: MiroirTestSuite): string[] {
  return (["testbedModel", "testbedEntitiesAndInstances", "testConfiguration"] as const).filter(
    (field) => field in definition,
  );
}

function minimalSuite(overrides: Record<string, unknown> = {}): MiroirTestSuite {
  return {
    miroirTestType: "miroirTestSuite",
    miroirTestLabel: "resolveSuitePlayfieldSeed.xor",
    miroirTests: [],
    ...overrides,
  } as MiroirTestSuite;
}

function loadTestConfiguration(path: string): TestConfigurationPlayfield {
  const row = JSON.parse(readFileSync(path, "utf8")) as TestConfigurationPlayfield;
  return {
    uuid: row.uuid,
    testbedModel: row.testbedModel,
    testbedEntitiesAndInstances: row.testbedEntitiesAndInstances,
  };
}

(shouldRun ? describe : describe.skip)("resolveSuitePlayfieldSeed", () => {
  it("returns null for skipRunTargetPlayfieldReset suites", () => {
    expect(resolveSuitePlayfieldSeed(suiteDefinition(miroirTest_runner_create_entity))).toBeNull();
    expect(resolveSuitePlayfieldSeed(suiteDefinition(miroirTest_runner_drop_entity))).toBeNull();
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
      testConfiguration: SYNTHETIC_CONFIG_UUID,
      testbedModel: {
        applicationUuid: LIBRARY_APPLICATION_UUID,
        applicationName: "Library",
      },
      testbedEntitiesAndInstances: [],
    });
    expect(() => resolveSuitePlayfieldSeed(suite)).toThrow(/both testConfiguration and inline/i);
  });

  it("throws when testConfiguration is set but no loader is provided", () => {
    const suite = minimalSuite({ testConfiguration: SYNTHETIC_CONFIG_UUID });
    expect(() => resolveSuitePlayfieldSeed(suite)).toThrow(/no loader/i);
  });

  it("throws when testConfiguration uuid is unknown to the loader", () => {
    const suite = minimalSuite({ testConfiguration: SYNTHETIC_CONFIG_UUID });
    expect(() => resolveSuitePlayfieldSeed(suite, () => undefined)).toThrow(
      /unknown testConfiguration/i,
    );
  });

  it("returns the loaded TestConfiguration payload for a uuid", () => {
    const loaded: TestConfigurationPlayfield = {
      uuid: SYNTHETIC_CONFIG_UUID,
      testbedModel: {
        applicationUuid: LIBRARY_APPLICATION_UUID,
        applicationName: "Library",
      },
      testbedEntitiesAndInstances: [],
    };
    const suite = minimalSuite({ testConfiguration: SYNTHETIC_CONFIG_UUID });
    expect(
      resolveSuitePlayfieldSeed(suite, (uuid) =>
        uuid === SYNTHETIC_CONFIG_UUID ? loaded : undefined,
      ),
    ).toEqual({
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
      miroirTestLabel: "resolveSuitePlayfieldSeed.schema",
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

  it("integ suites have inline playfield, a TestConfiguration uuid, or neither (skipReset)", () => {
    const definitions: Record<string, MiroirTestSuite> = {
      runner_lend_document: suiteDefinition(miroirTest_runner_lend_document),
      runner_return_document: suiteDefinition(miroirTest_runner_return_document),
      runner_create_entity: suiteDefinition(miroirTest_runner_create_entity),
      runner_drop_entity: suiteDefinition(miroirTest_runner_drop_entity),
      runner_freeze_application_version: suiteDefinition(
        miroirTest_runner_freeze_application_version,
      ),
      domain_controller_data_crud: suiteDefinition(miroirTest_domain_controller_data_crud),
      domain_controller_model_crud: suiteDefinition(miroirTest_domain_controller_model_crud),
      domain_controller_composite_pk_crud: suiteDefinition(
        miroirTest_domain_controller_composite_pk_crud,
      ),
      domain_controller_non_uuid_pk_model_crud: suiteDefinition(
        miroirTest_domain_controller_non_uuid_pk_model_crud,
      ),
      domain_controller_non_uuid_pk_data_crud: suiteDefinition(
        miroirTest_domain_controller_non_uuid_pk_data_crud,
      ),
      domain_controller_no_parent_uuid_crud: suiteDefinition(
        miroirTest_domain_controller_no_parent_uuid_crud,
      ),
      domain_controller_model_undo_redo: suiteDefinition(
        miroirTest_domain_controller_model_undo_redo,
      ),
      domain_controller_application_version_freeze: suiteDefinition(
        miroirTest_domain_controller_application_version_freeze,
      ),
      evolutionTraceWP1: suiteDefinition(miroirTest_evolutionTraceWP1),
    };
    const inlinePlayfieldKeys = new Set([
      "domain_controller_model_undo_redo",
      "domain_controller_data_crud",
      "domain_controller_composite_pk_crud",
      "domain_controller_non_uuid_pk_model_crud",
      "domain_controller_non_uuid_pk_data_crud",
      "domain_controller_no_parent_uuid_crud",
      "runner_freeze_application_version",
    ]);
    const uuidPlayfieldKeys = new Set([
      "runner_lend_document",
      "runner_return_document",
      "domain_controller_model_crud",
      "domain_controller_application_version_freeze",
      "evolutionTraceWP1",
    ]);
    expect(Object.keys(definitions).sort()).toEqual([
      "domain_controller_application_version_freeze",
      "domain_controller_composite_pk_crud",
      "domain_controller_data_crud",
      "domain_controller_model_crud",
      "domain_controller_model_undo_redo",
      "domain_controller_no_parent_uuid_crud",
      "domain_controller_non_uuid_pk_data_crud",
      "domain_controller_non_uuid_pk_model_crud",
      "evolutionTraceWP1",
      "runner_create_entity",
      "runner_drop_entity",
      "runner_freeze_application_version",
      "runner_lend_document",
      "runner_return_document",
    ]);
    for (const [name, definition] of Object.entries(definitions)) {
      if (inlinePlayfieldKeys.has(name)) {
        expect(playfieldFieldsOn(definition), name).toEqual([
          "testbedModel",
          "testbedEntitiesAndInstances",
        ]);
        continue;
      }
      if (uuidPlayfieldKeys.has(name)) {
        expect(playfieldFieldsOn(definition), name).toEqual(["testConfiguration"]);
        continue;
      }
      expect(playfieldFieldsOn(definition), name).toEqual([]);
    }
  });
});

(shouldRun ? describe : describe.skip)("Library document TestConfiguration", () => {
  const configPath = join(
    REPO_ROOT,
    "packages/miroir-test-app_deployment-library/assets/library_model",
    TEST_CONFIGURATION_ENTITY_UUID,
    `${LIBRARY_DOCUMENT_CONFIG_UUID}.json`,
  );

  it("instance lives under library_model TestConfiguration with Library selfApplication", () => {
    const row = JSON.parse(readFileSync(configPath, "utf8")) as {
      uuid?: string;
      parentUuid?: string;
      selfApplication?: string;
    };
    expect(row.uuid).toBe(LIBRARY_DOCUMENT_CONFIG_UUID);
    expect(row.parentUuid).toBe(TEST_CONFIGURATION_ENTITY_UUID);
    expect(row.selfApplication).toBe(LIBRARY_APPLICATION_UUID);
    expect(row.selfApplication).toBe(selfApplicationLibrary.uuid);
    expect(getApplicationSection(LIBRARY_APPLICATION_UUID, TEST_CONFIGURATION_ENTITY_UUID)).toBe(
      "model",
    );
  });

  it("lend and return suite JSON reference the uuid and have no inline playfield", () => {
    for (const instance of [miroirTest_runner_lend_document, miroirTest_runner_return_document]) {
      const suite = suiteDefinition(instance);
      expect(playfieldFieldsOn(suite), suite.miroirTestLabel).toEqual(["testConfiguration"]);
      expect(suite.testConfiguration).toBe(LIBRARY_DOCUMENT_CONFIG_UUID);
    }
  });

  it("resolveSuitePlayfieldSeed for lend and return equals the Library instance payload", () => {
    const loaded = loadTestConfiguration(configPath);
    const getTestConfiguration = (uuid: string) =>
      uuid === LIBRARY_DOCUMENT_CONFIG_UUID ? loaded : undefined;
    expect(loaded.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid)).toEqual([
      AUTHOR_UUID,
      BOOK_UUID,
      PUBLISHER_UUID,
      USER_UUID,
    ]);
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
});

(shouldRun ? describe : describe.skip)("Miroir Publisher+Country TestConfiguration", () => {
  const configPath = join(
    REPO_ROOT,
    "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
    TEST_CONFIGURATION_ENTITY_UUID,
    `${MIROIR_PUBLISHER_COUNTRY_CONFIG_UUID}.json`,
  );
  const suiteInstances = [
    miroirTest_domain_controller_model_crud,
    miroirTest_domain_controller_application_version_freeze,
    miroirTest_evolutionTraceWP1,
  ];

  it("instance lives under miroir_data TestConfiguration with Miroir selfApplication", () => {
    const row = JSON.parse(readFileSync(configPath, "utf8")) as {
      uuid?: string;
      parentUuid?: string;
      selfApplication?: string;
    };
    expect(row.uuid).toBe(MIROIR_PUBLISHER_COUNTRY_CONFIG_UUID);
    expect(row.parentUuid).toBe(TEST_CONFIGURATION_ENTITY_UUID);
    expect(row.selfApplication).toBe(MIROIR_APPLICATION_UUID);
    expect(row.selfApplication).toBe(selfApplicationMiroir.uuid);
    expect(getApplicationSection(MIROIR_APPLICATION_UUID, TEST_CONFIGURATION_ENTITY_UUID)).toBe(
      "data",
    );
  });

  it("model_crud, freeze, and evolutionTraceWP1 suite JSON reference the uuid and have no inline playfield", () => {
    for (const instance of suiteInstances) {
      const suite = suiteDefinition(instance);
      expect(playfieldFieldsOn(suite), suite.miroirTestLabel).toEqual(["testConfiguration"]);
      expect(suite.testConfiguration).toBe(MIROIR_PUBLISHER_COUNTRY_CONFIG_UUID);
    }
  });

  it("resolveSuitePlayfieldSeed for the three suites equals the Miroir instance payload", () => {
    const loaded = loadTestConfiguration(configPath);
    const getTestConfiguration = (uuid: string) =>
      uuid === MIROIR_PUBLISHER_COUNTRY_CONFIG_UUID ? loaded : undefined;
    expect(loaded.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid)).toEqual([
      PUBLISHER_UUID,
      COUNTRY_UUID,
    ]);
    expect(loaded.testbedEntitiesAndInstances.map((entry) => entry.instances.length)).toEqual([
      3, 3,
    ]);
    expect(loaded.testbedModel.applicationUuid).toBe(LIBRARY_APPLICATION_UUID);
    expect(loaded.testbedModel.applicationName).toBe("Library");
    expect((loaded.testbedModel.entities ?? []).map((entity) => entity.uuid)).toEqual([
      PUBLISHER_UUID,
      COUNTRY_UUID,
    ]);
    for (const instance of suiteInstances) {
      const suite = suiteDefinition(instance);
      expect(resolveSuitePlayfieldSeed(suite, getTestConfiguration), suite.miroirTestLabel).toEqual({
        testbedModel: loaded.testbedModel,
        testbedEntitiesAndInstances: loaded.testbedEntitiesAndInstances,
      });
    }
  });
});

(shouldRun ? describe : describe.skip)("unique DC suite-owned inline playfields", () => {
  const suiteInstances = [
    miroirTest_domain_controller_data_crud,
    miroirTest_domain_controller_composite_pk_crud,
    miroirTest_domain_controller_non_uuid_pk_model_crud,
    miroirTest_domain_controller_non_uuid_pk_data_crud,
    miroirTest_domain_controller_no_parent_uuid_crud,
  ];
  const libraryEntityDir = join(
    REPO_ROOT,
    "packages/miroir-test-app_deployment-library/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  );

  it("five unique DC suite JSON files have inline playfield and no testConfiguration", () => {
    for (const instance of suiteInstances) {
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
    const seed = resolveSuitePlayfieldSeed(suiteDefinition(miroirTest_domain_controller_data_crud));
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
    const entityFiles = readdirSync(libraryEntityDir).filter((file) => file.endsWith(".json"));
    for (const uuid of [COMPOSITE_PK_UUID, CODE_NUMBER_UUID, NO_PARENT_UUID]) {
      expect(entityFiles, uuid).not.toContain(`${uuid}.json`);
    }
    for (const file of entityFiles) {
      const row = JSON.parse(readFileSync(join(libraryEntityDir, file), "utf8")) as {
        uuid?: string;
      };
      expect([COMPOSITE_PK_UUID, CODE_NUMBER_UUID, NO_PARENT_UUID]).not.toContain(row.uuid);
    }
  });
});

(shouldRun ? describe : describe.skip)("freeze suite inline appForTest playfield", () => {
  it("runner_freeze_application_version JSON has inline playfield and no testConfiguration", () => {
    const suite = suiteDefinition(miroirTest_runner_freeze_application_version);
    expect(playfieldFieldsOn(suite)).toEqual(["testbedModel", "testbedEntitiesAndInstances"]);
    expect(suite.testConfiguration).toBeUndefined();
    expect(suite.testConfiguration).not.toBe(RESERVED_UNUSED_CONFIG_UUID);
  });

  it("resolveSuitePlayfieldSeed returns the appForTest Publisher+Country slice without a loader", () => {
    const seed = resolveSuitePlayfieldSeed(
      suiteDefinition(miroirTest_runner_freeze_application_version),
    );
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
    expect((seed.testbedModel.applications ?? []).map((application) => application.uuid)).toEqual([
      APP_FOR_TEST_UUID,
    ]);
    expect((seed.testbedModel.applicationVersions ?? []).map((version) => version.uuid)).toEqual([
      APP_FOR_TEST_VERSION_UUID,
    ]);
    expect(seed.testbedModel.reports).toBeUndefined();
    expect(seed.testbedModel.menus).toBeUndefined();
    expect(seed.testbedModel.endpoints).toBeUndefined();
    expect(seed.testbedEntitiesAndInstances.map((entry) => entry.entity.uuid)).toEqual([
      PUBLISHER_UUID,
      COUNTRY_UUID,
    ]);
    expect(seed.testbedEntitiesAndInstances.map((entry) => entry.instances.length)).toEqual([3, 3]);
  });
});
