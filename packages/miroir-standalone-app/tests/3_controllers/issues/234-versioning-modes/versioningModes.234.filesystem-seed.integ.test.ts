/**
 * #234 Slice 3.2 — filesystem emulated server seeds Version History from miroir_modelVersion assets.
 *
 * Run:
 * ```bash
 * VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
 *   npm run testByFile -w miroir-standalone-app -- versioningModes.234.filesystem-seed
 * ```
 */
import { beforeAll, describe, expect, it } from "vitest";
import process from "process";
import { join } from "node:path";

import type { EntityInstance, EntityInstanceCollection, StoreUnitConfiguration } from "miroir-core";
import {
  Action2Error,
  ConfigurationService,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManagerInterface,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import { defaultMiroirMetaModel as deploymentMetaModel, entityEntityVersion } from "miroir-test-app_deployment-miroir";

import { miroirAppStartup } from "../../../../src/startup.js";
import { setupMiroirTest } from "../../../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { loadTestConfigFiles } from "../../../utils/fileTools.js";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";
import { seedMiroirModelVersionTmpFromPackageAssets } from "../../../helpers/seedMiroirModelVersionTmpFromPackageAssets.js";
import { cleanLevel, packageName } from "../../constants.js";
import { MIROIR_VERSION_HISTORY_PARENTS_SLICE0 } from "../../../../../miroir-core/tests/1_core/issues/234-versioning-modes/versioningModes.234.slice0-inventory.js";

const MIROIR_DEPLOYMENT_UUID = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const SELF_ENTITY_VERSION_UUID = "bdd7ad43-f0fc-4716-90c1-87454c40dd95";

const env = process.env;
const fileName = "versioningModes.234.filesystem-seed.integ.test";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
).then((logger: LoggerInterface) => {
  log = logger;
});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const { miroirConfig: miroirConfigParam, logConfig } = await loadTestConfigFiles(env);
const miroirConfig = miroirConfigParam;
miroirConfig.client.filesystemDeploymentRootDirectory = join(resolveRepoRoot(), "packages");
const loggerOptions: LoggerOptions = logConfig;
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);

const globalTimeOut = 60000;

let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
let miroirStorageConfiguration: StoreUnitConfiguration;

function miroirPersistenceStore() {
  const controller = persistenceStoreControllerManager.getPersistenceStoreController(
    MIROIR_DEPLOYMENT_UUID,
  );
  expect(controller, "miroir persistence store controller missing").toBeDefined();
  return controller!;
}

async function getPersistedInstances(section: "data" | "modelVersion", parentEntityUuid: string) {
  const result = await miroirPersistenceStore().getInstances(section, parentEntityUuid);
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
  if (result instanceof Action2Error) {
    return [] as EntityInstance[];
  }
  const collection = result.returnedDomainElement as EntityInstanceCollection | undefined;
  return (collection?.instances ?? []) as EntityInstance[];
}

beforeAll(async () => {
  log.info(fileName, "beforeAll");
  seedMiroirModelVersionTmpFromPackageAssets(
    miroirConfig.client.filesystemDeploymentRootDirectory as string,
  );

  const miroirDeploymentStorageConfiguration =
    miroirConfig.client.deploymentStorageConfig[MIROIR_DEPLOYMENT_UUID];
  expect(miroirDeploymentStorageConfiguration?.modelVersion).toBeDefined();

  const wired = await setupMiroirTest(miroirConfig, miroirActivityTracker, miroirEventService);
  persistenceStoreControllerManager = wired.persistenceStoreControllerManagerForServer!;
  miroirStorageConfiguration = miroirDeploymentStorageConfiguration as StoreUnitConfiguration;

  await persistenceStoreControllerManager.addPersistenceStoreController(
    MIROIR_DEPLOYMENT_UUID,
    miroirStorageConfiguration,
  );
  const store = miroirPersistenceStore();
  await store.open();
  const bootResult = await store.bootFromPersistedState(deploymentMetaModel.entities);
  expect(bootResult instanceof Action2Error, JSON.stringify(bootResult)).toBe(false);
  log.info(fileName, "beforeAll DONE");
}, globalTimeOut);

describe("234 Slice 3.2 — Miroir filesystem modelVersion seed", () => {
  it("emulated-server filesystem config includes modelVersion for Miroir deployment", () => {
    expect(miroirStorageConfiguration.modelVersion).toBeDefined();
    expect(miroirStorageConfiguration.modelVersion!.emulatedServerType).toBe("filesystem");
    expect(miroirStorageConfiguration.modelVersion!.directory).toMatch(/tests\/tmp\/miroir_modelVersion/);
  });

  it("bootstrapped store reads EntityVersion instances from modelVersion section", async () => {
    const entityVersions = await getPersistedInstances("modelVersion", entityEntityVersion.uuid!);
    expect(entityVersions.length).toBe(
      MIROIR_VERSION_HISTORY_PARENTS_SLICE0[entityEntityVersion.uuid!],
    );
    const selfEntityVersion = entityVersions.find((row) => row.uuid === SELF_ENTITY_VERSION_UUID);
    expect(selfEntityVersion?.uuid).toBe(SELF_ENTITY_VERSION_UUID);
    expect(selfEntityVersion?.mlSchema).toBeDefined();
  });

  it("same EntityVersion UUIDs are not returned from data section", async () => {
    const dataEntityVersions = await getPersistedInstances("data", entityEntityVersion.uuid!);
    expect(dataEntityVersions).toEqual([]);
    const uuids = dataEntityVersions.map((row) => row.uuid);
    expect(uuids).not.toContain(SELF_ENTITY_VERSION_UUID);
  });

  it("SelfApplicationVersion seed rows are readable from modelVersion only", async () => {
    const savParentUuid = "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24";
    const modelVersionRows = await getPersistedInstances("modelVersion", savParentUuid);
    const dataRows = await getPersistedInstances("data", savParentUuid);
    expect(modelVersionRows.length).toBe(MIROIR_VERSION_HISTORY_PARENTS_SLICE0[savParentUuid]);
    expect(dataRows).toEqual([]);
  });
});
