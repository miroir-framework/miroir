/**
 * #647: the devData section of the Miroir application on the emulated filesystem server of
 * `test-filesystem` (copies in .miroir/test-filesystem/, seeded from the tracked rows of the package
 * assets). The cases every store shares are in devDataSection.integ.test.ts. The
 * deployments are the ones the environment derives, which no test-storage helper rewrites: Miroir
 * declares devData there, Library does not.
 *
 * Not reachable through MiroirTest: it asserts the store sections and their files on disk, which are
 * framework internals.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- devDataSection.filesystem.integ
 * ```
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  ConfigurationService,
  getApplicationSection,
  getReduxDeploymentsStateIndex,
  metaModelEntities,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  type DomainControllerInterface,
  type EntityInstance,
  type MiroirConfigClient,
  type MiroirConfigForClientStub,
  type PersistenceStoreControllerInterface,
  type PersistenceStoreControllerManagerInterface,
  type StoreSectionConfiguration,
} from "@miroir-framework/core";
import { bootEnvironment } from "@miroir-framework/env";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { fetchMiroirAndAppConfigurations } from "@miroir-framework/react";
import { setupMiroirTest } from "../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { miroirAppStartup } from "../../src/startup.js";
import { openTestEnvironment } from "../helpers/testEnvironment.js";

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(miroirActivityTracker, miroirEventService, loglevelnext, {
  defaultLevel: "WARN",
  specificLoggerOptions: {},
} as any);

const MIROIR_APPLICATION = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const LIBRARY_APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const BUNDLE_SIZE_MEASUREMENT = "90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b";
const PAGE_LOAD_MEASUREMENT = "0266c0b8-4dc8-4a14-bcef-239a85a5de2d";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
/** Bundle size rows tracked when the section was introduced (Slice 0 inventory). */
const TRACKED_BUNDLE_SIZE_ROWS = 28;

const applicationDeploymentMap = {
  [MIROIR_APPLICATION]: MIROIR_DEPLOYMENT,
  [LIBRARY_APPLICATION]: LIBRARY_DEPLOYMENT,
};

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

function createInstance(application: string, applicationSection: string, objects: EntityInstance[]) {
  return domainController.handleAction(
    {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: { application, applicationSection: applicationSection as any, objects },
    },
    applicationDeploymentMap,
  );
}

function rollback(application: string) {
  return domainController.handleAction(
    { actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application } },
    applicationDeploymentMap,
    domainController.currentModelEnvironment(application, applicationDeploymentMap),
  );
}

function sectionFolder(section: "data" | "devData", entityUuid: string): string {
  const client = miroirConfig.client as MiroirConfigForClientStub;
  const configuration = client.deploymentStorageConfig[MIROIR_DEPLOYMENT][section] as StoreSectionConfiguration & {
    directory: string;
  };
  return path.resolve(client.filesystemDeploymentRootDirectory, configuration.directory, entityUuid);
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

/** The keys of the local cache state down to its collections (presentModelSnapshot.current, …). */
function cacheKeys(state: unknown, depth = 3): string[] {
  if (depth === 0 || !state || typeof state !== "object" || Array.isArray(state)) {
    return [];
  }
  return Object.entries(state as Record<string, unknown>).flatMap(([key, value]) => [
    key,
    ...cacheKeys(value, depth - 1),
  ]);
}

let domainController: DomainControllerInterface;
let miroirConfig: MiroirConfigClient;
let serverManager: PersistenceStoreControllerManagerInterface;

function serverController(deploymentUuid: string): PersistenceStoreControllerInterface {
  const controller = serverManager.getPersistenceStoreController(deploymentUuid);
  expect(controller, deploymentUuid).toBeDefined();
  return controller!;
}

beforeAll(async () => {
  const testEnvironment = openTestEnvironment("test-filesystem");
  const wired = await setupMiroirTest(testEnvironment.miroirConfig, miroirActivityTracker, miroirEventService);
  await bootEnvironment(wired.domainControllerForServer!, testEnvironment.resolved, process.env);
  const loaded = await fetchMiroirAndAppConfigurations({
    domainController: wired.domainControllerForClient,
    miroirConfig: testEnvironment.miroirConfig,
  });
  expect(loaded?.status, "the configurations load").not.toBe("error");
  domainController = wired.domainControllerForClient;
  miroirConfig = testEnvironment.miroirConfig;
  serverManager = wired.persistenceStoreControllerManagerForServer!;
});

describe("devData section of the Miroir application on test-filesystem (#647)", () => {
  it("routes the measurement Entities to devData", () => {
    expect(getApplicationSection(MIROIR_APPLICATION, BUNDLE_SIZE_MEASUREMENT)).toBe("devData");
    expect(getApplicationSection(LIBRARY_APPLICATION, PAGE_LOAD_MEASUREMENT)).toBe("devData");
  });

  it("reads the tracked bundle size rows from Miroir's devData", async () => {
    const uuids = await instanceUuids(
      serverController(MIROIR_DEPLOYMENT),
      getApplicationSection(MIROIR_APPLICATION, BUNDLE_SIZE_MEASUREMENT) as "devData",
      BUNDLE_SIZE_MEASUREMENT,
    );
    expect(uuids.length).toBeGreaterThanOrEqual(TRACKED_BUNDLE_SIZE_ROWS);
  });

  it("writes a created row in devData only (D12)", async () => {
    const row = bundleSizeRow("7d0b6f4e-6f8e-4d3e-9d55-647000000001");
    const result = await createInstance(MIROIR_APPLICATION, "devData", [row]);
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);

    expect(existsSync(path.join(sectionFolder("devData", BUNDLE_SIZE_MEASUREMENT), `${row.uuid}.json`))).toBe(true);
    expect(sectionFolder("devData", BUNDLE_SIZE_MEASUREMENT)).toContain(path.join(".miroir", "test-filesystem"));
    const dataFolder = sectionFolder("data", BUNDLE_SIZE_MEASUREMENT);
    expect(existsSync(dataFolder) ? readdirSync(dataFolder) : []).toEqual([]);
  });

  describe("on an application whose deployment has no devData section", () => {
    it("rolls back (D22)", async () => {
      const result = await rollback(LIBRARY_APPLICATION);
      expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    });
  });

  it("rolls Miroir back without loading the page load rows (D4, D22)", async () => {
    const result = await rollback(MIROIR_APPLICATION);
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    const cached = cacheKeys(domainController.getLocalCache().getState());
    expect(cached).toContain(getReduxDeploymentsStateIndex(MIROIR_DEPLOYMENT, "devData", BUNDLE_SIZE_MEASUREMENT));
    expect(cached.filter((key) => key.includes(PAGE_LOAD_MEASUREMENT))).toEqual([]);
  });

  it("reads the rows again after the deployment is closed and reopened (D21)", async () => {
    const controller = serverController(MIROIR_DEPLOYMENT);
    const before = await instanceUuids(controller, "devData", BUNDLE_SIZE_MEASUREMENT);
    await controller.close();
    expect(await controller.open()).not.toBeInstanceOf(Action2Error);
    expect(await controller.bootFromPersistedState(metaModelEntities)).not.toBeInstanceOf(Action2Error);
    expect((await instanceUuids(controller, "devData", BUNDLE_SIZE_MEASUREMENT)).sort()).toEqual(before.sort());
  });
});
