/**
 * #647: the devData section of the Miroir application, in a store of its own, on every store
 * (filesystem, IndexedDb (Level in Node), Postgres, MongoDB). The deployments are the ones the test
 * environment derives; Miroir declares devData there, Library does not. A devData section that is not
 * a filesystem copy starts empty (the seeding copies only the package's exported JSON, D10).
 *
 * Not reachable through MiroirTest: it asserts the store sections, their restart and their teardown,
 * which are framework internals. The filesystem copy, seeded from the tracked rows, has its own cases in
 * devDataSection.filesystem.integ.test.ts.
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- devDataSection.integ --profile emulatedServer-filesystem
 * npm run testByFile -w miroir-standalone-app -- devDataSection.integ --profile emulatedServer-indexedDb
 * MIROIR_POSTGRES_PASSWORD=... npm run testByFile -w miroir-standalone-app -- devDataSection.integ --profile emulatedServer-sql
 * npm run testByFile -w miroir-standalone-app -- devDataSection.integ --profile emulatedServer-mongodb
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  ConfigurationService,
  getApplicationSection,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  type EntityInstance,
  type MiroirConfigForClientStub,
  type PersistenceStoreControllerInterface,
  type PersistenceStoreControllerManagerInterface,
  type StoreUnitConfiguration,
} from "@miroir-framework/core";
import { bootEnvironment } from "@miroir-framework/env";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "@miroir-framework/store-indexeddb";
import { miroirMongoDbStoreSectionStartup } from "@miroir-framework/store-mongodb";
import { miroirPostgresStoreSectionStartup } from "@miroir-framework/store-postgres";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { setupMiroirTest } from "../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { testApplicationStorageConfiguration } from "../../src/miroir-fwk/4-tests/runnerIntegTestSupport.js";
import { miroirAppStartup } from "../../src/startup.js";
import { openTestEnvironment, selectedTestEnvironment } from "../helpers/testEnvironment.js";

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(miroirActivityTracker, miroirEventService, loglevelnext, {
  defaultLevel: "WARN",
  specificLoggerOptions: {},
} as any);

const MIROIR_APPLICATION = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const BUNDLE_SIZE_MEASUREMENT = "90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b";
const STORE_ENDPOINT = "bbd08cbb-79ff-4539-b91f-7a14f15ac55f";
const ENVIRONMENT = selectedTestEnvironment(process.env) ?? "test-indexedDb";

function bundleSizeRow(uuid: string): EntityInstance {
  return {
    uuid,
    parentName: "BundleSizeMeasurement",
    parentUuid: BUNDLE_SIZE_MEASUREMENT,
    application: "miroir-standalone-app",
    measuredAt: "2026-11-01T10:00:00.000Z",
    eagerGzipBytes: 1_000_000,
    baseline: 1_000_000,
  } as EntityInstance;
}

async function instanceUuids(
  controller: PersistenceStoreControllerInterface,
  section: "data" | "devData",
  entityUuid: string,
): Promise<string[]> {
  const result = await controller.getInstances(section, entityUuid);
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
  return ((result as any).returnedDomainElement.instances as EntityInstance[]).map((instance) => instance.uuid);
}

/** Where a section's rows are kept, whatever the store: its directory, schema, database or Level name. */
function storeName(configuration: unknown): string {
  const section = configuration as Record<string, string>;
  return section.directory ?? section.schema ?? section.database ?? section.indexedDbName;
}

let serverManager: PersistenceStoreControllerManagerInterface;
let wired: Awaited<ReturnType<typeof setupMiroirTest>>;
let deploymentStorageConfig: Record<string, StoreUnitConfiguration>;

function serverController(deploymentUuid: string): PersistenceStoreControllerInterface {
  const controller = serverManager.getPersistenceStoreController(deploymentUuid);
  expect(controller, deploymentUuid).toBeDefined();
  return controller!;
}

beforeAll(async () => {
  const testEnvironment = openTestEnvironment(ENVIRONMENT);
  wired = await setupMiroirTest(testEnvironment.miroirConfig, miroirActivityTracker, miroirEventService);
  await bootEnvironment(wired.domainControllerForServer!, testEnvironment.resolved, process.env);
  serverManager = wired.persistenceStoreControllerManagerForServer!;
  deploymentStorageConfig = (testEnvironment.miroirConfig.client as MiroirConfigForClientStub)
    .deploymentStorageConfig as Record<string, StoreUnitConfiguration>;
});

afterAll(async () => {
  await serverManager?.deletePersistenceStoreController(MIROIR_DEPLOYMENT);
  await serverManager?.deletePersistenceStoreController(LIBRARY_DEPLOYMENT);
});

describe(`devData section on ${ENVIRONMENT} (#647)`, () => {
  it("gives Miroir's devData a store of its own", () => {
    const miroir = deploymentStorageConfig[MIROIR_DEPLOYMENT];
    expect(miroir.devData, "Miroir declares devData").toBeDefined();
    expect(storeName(miroir.devData)).not.toBe(storeName(miroir.data));
    expect(storeName(miroir.devData)).not.toBe(storeName(miroir.model));
    expect(storeName(miroir.devData)).toMatch(/devData/);
  });

  it("writes a row in devData only, and reads it again after a restart (D12, D21)", async () => {
    const row = bundleSizeRow("7d0b6f4e-6f8e-4d3e-9d55-647000000301");
    const controller = serverController(MIROIR_DEPLOYMENT);
    const section = getApplicationSection(MIROIR_APPLICATION, BUNDLE_SIZE_MEASUREMENT) as "devData";
    expect(section).toBe("devData");

    const written = await controller.upsertInstance(section, row);
    expect(written instanceof Action2Error, JSON.stringify(written)).toBe(false);
    expect(await instanceUuids(controller, "devData", BUNDLE_SIZE_MEASUREMENT)).toContain(row.uuid);

    // restart: openStore replaces the deployment's controller by a new one, opened and booted
    const reopened = await wired.domainControllerForServer!.handleAction(
      {
        actionType: "storeManagementAction_openStore",
        endpoint: STORE_ENDPOINT,
        payload: {
          application: MIROIR_APPLICATION,
          deploymentUuid: MIROIR_DEPLOYMENT,
          configuration: { [MIROIR_DEPLOYMENT]: deploymentStorageConfig[MIROIR_DEPLOYMENT] },
        },
      } as any,
      { [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT },
    );
    expect(reopened instanceof Action2Error, JSON.stringify(reopened)).toBe(false);
    const restarted = serverController(MIROIR_DEPLOYMENT);
    expect(restarted).not.toBe(controller);
    expect(await instanceUuids(restarted, "devData", BUNDLE_SIZE_MEASUREMENT)).toContain(row.uuid);
  });

  it("refuses a devData row written to another section (D23)", async () => {
    const result = await serverController(MIROIR_DEPLOYMENT).upsertInstance(
      "data",
      bundleSizeRow("7d0b6f4e-6f8e-4d3e-9d55-647000000302"),
    );
    expect(result instanceof Action2Error).toBe(true);
    expect((result as Action2Error).errorMessage).toContain("devData");
  });

  it("keeps the devData rows when the model is cleared (D24)", async () => {
    const controller = serverController(MIROIR_DEPLOYMENT);
    const before = await instanceUuids(controller, "devData", BUNDLE_SIZE_MEASUREMENT);
    expect(before.length).toBeGreaterThan(0);
    expect(await controller.clear()).not.toBeInstanceOf(Action2Error);
    expect((await instanceUuids(controller, "devData", BUNDLE_SIZE_MEASUREMENT)).sort()).toEqual(before.sort());
  });

  describe("on an application whose deployment has no devData section", () => {
    it("reads nothing", async () => {
      expect(await instanceUuids(serverController(LIBRARY_DEPLOYMENT), "devData", BUNDLE_SIZE_MEASUREMENT)).toEqual([]);
    });

    it("refuses a write with a named error", async () => {
      const result = await serverController(LIBRARY_DEPLOYMENT).upsertInstance(
        "devData",
        bundleSizeRow("7d0b6f4e-6f8e-4d3e-9d55-647000000303"),
      );
      expect(result instanceof Action2Error).toBe(true);
      expect((result as Action2Error).errorMessage).toContain("devData section is not configured");
    });
  });

  // The filesystem store's deleteStore keeps its directories, for every section (FileSystemAdminStore).
  it.skipIf(ENVIRONMENT === "test-filesystem")("drops a test application's devData store on teardown (D14)", async () => {
    const testApplication = "6a4e1c9e-8f0b-4c47-9a39-647000000310";
    const testDeployment = "6a4e1c9e-8f0b-4c47-9a39-647000000311";
    const configuration = testApplicationStorageConfiguration(
      deploymentStorageConfig[LIBRARY_DEPLOYMENT],
      "DevData647",
      testDeployment,
      deploymentStorageConfig[MIROIR_DEPLOYMENT],
    );
    expect(configuration.devData, "the test application has a devData store").toBeDefined();
    const applicationDeploymentMap = { [testApplication]: testDeployment };
    const storeAction = (actionType: string, payload: Record<string, unknown>) =>
      wired.domainControllerForServer!.handleAction(
        { actionType, endpoint: STORE_ENDPOINT, payload: { application: testApplication, ...payload } } as any,
        applicationDeploymentMap,
      );

    const opened = await storeAction("storeManagementAction_openStore", {
      configuration: { [testDeployment]: configuration },
      deploymentUuid: testDeployment,
    });
    expect(opened instanceof Action2Error, JSON.stringify(opened)).toBe(false);
    const created = await storeAction("storeManagementAction_createStore", { configuration, deploymentUuid: testDeployment });
    expect(created instanceof Action2Error, JSON.stringify(created)).toBe(false);

    const controller = serverController(testDeployment);
    const row = bundleSizeRow("7d0b6f4e-6f8e-4d3e-9d55-647000000312");
    const written = await controller.upsertInstance("devData", row);
    expect(written instanceof Action2Error, JSON.stringify(written)).toBe(false);
    expect(await instanceUuids(controller, "devData", BUNDLE_SIZE_MEASUREMENT)).toEqual([row.uuid]);

    const deleted = await storeAction("storeManagementAction_deleteStore", { configuration, deploymentUuid: testDeployment });
    expect(deleted instanceof Action2Error, JSON.stringify(deleted)).toBe(false);

    // Created again from the same configuration, the devData store has no row left.
    const reopened = await storeAction("storeManagementAction_openStore", {
      configuration: { [testDeployment]: configuration },
      deploymentUuid: testDeployment,
    });
    expect(reopened instanceof Action2Error, JSON.stringify(reopened)).toBe(false);
    expect(await instanceUuids(serverController(testDeployment), "devData", BUNDLE_SIZE_MEASUREMENT)).toEqual([]);
    await storeAction("storeManagementAction_deleteStore", { configuration, deploymentUuid: testDeployment });
    await storeAction("storeManagementAction_closeStore", {});
  });
});
