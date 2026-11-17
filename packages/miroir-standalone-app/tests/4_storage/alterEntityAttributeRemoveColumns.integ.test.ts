/**
 * #733: `alterEntityAttribute` with `removeColumns` removes the attribute's values from the stored
 * instances, on every store: SQL drops the column (#745 D7), the filesystem, IndexedDB and MongoDB
 * stores rewrite each instance that holds the attribute. A later `addColumns` of the same name finds
 * no old value.
 *
 * Not reachable through MiroirTest: it writes to the store controller directly. Run it per store profile:
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 4_storage/alterEntityAttributeRemoveColumns
 * MIROIR_ENV=test-indexedDb npm run testByFile -w miroir-standalone-app -- 4_storage/alterEntityAttributeRemoveColumns
 * ```
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import process from "process";

import {
  Action2Error,
  ConfigurationService,
  defaultLevels,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resetIntegTestbed,
  testUtils_deleteApplicationDeployment,
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type Entity,
  type EntityInstance,
  type PersistenceStoreControllerInterface,
  type StoreUnitConfiguration,
} from "@miroir-framework/core";
import { deployment_Admin } from "@miroir-framework/core/admin";
import { entityEntity } from "@miroir-framework/core/meta-model";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "@miroir-framework/store-indexeddb";
import { miroirMongoDbStoreSectionStartup } from "@miroir-framework/store-mongodb";
import { miroirPostgresStoreSectionStartup } from "@miroir-framework/store-postgres";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-example-library";
import { selfApplicationDeploymentConfigurationsTO_REMOVE } from "miroir-react-testing/src/4-tests/tests-utils.js";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../../src/startup.js";
import { AppStackIntegrationTestSession } from "../helpers/IntegrationTestSession.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const { miroirConfig, logConfig } = await loadTestConfigFiles(process.env);
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  (defaultLevels as any)[(logConfig as any).defaultLevel] ?? logConfig,
);

const globalTimeOut = 60000;

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

function storageConfiguration(deploymentUuid: string): StoreUnitConfiguration {
  return (miroirConfig as any).client.emulateServer
    ? (miroirConfig as any).client.deploymentStorageConfig[deploymentUuid]
    : (miroirConfig as any).client.serverConfig.storeSectionConfiguration[deploymentUuid];
}

const libraryDeploymentStorageConfiguration = storageConfiguration(deployment_Library_DO_NO_USE.uuid);
const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: storageConfiguration(deployment_Admin.uuid),
};
const storeType: string = (libraryDeploymentStorageConfiguration.data as any).emulatedServerType;

const MOTTO = "motto733";
const note: Entity = {
  uuid: "733a0001-0000-4000-8000-000000000001",
  parentName: entityEntity.name,
  parentUuid: entityEntity.uuid,
  selfApplication: selfApplicationLibrary.uuid,
  name: "Note733",
  conceptLevel: "Model",
  description: "#733: an Entity whose attribute is removed",
  mlSchema: {
    type: "object",
    definition: {
      uuid: { type: "uuid" },
      parentName: { type: "string", optional: true },
      parentUuid: { type: "uuid" },
      name: { type: "string" },
      [MOTTO]: { type: "string", optional: true },
    },
  },
} as Entity;

function noteInstance(suffix: string, motto?: string): EntityInstance {
  return {
    uuid: `733b0001-0000-4000-8000-0000000000${suffix}`,
    parentUuid: note.uuid,
    parentName: note.name,
    name: `note ${suffix}`,
    ...(motto === undefined ? {} : { [MOTTO]: motto }),
  } as EntityInstance;
}

let domainController: DomainControllerInterface;
let store: PersistenceStoreControllerInterface;

function expectOk(result: unknown, label: string): void {
  expect(result instanceof Action2Error, `${label} failed: ${JSON.stringify(result)}`).toBe(false);
}

function alter(payload: { removeColumns?: string[]; addColumns?: { name: string; definition: any }[] }) {
  return store.alterEntityAttribute({
    actionType: "alterEntityAttribute",
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: { application: selfApplicationLibrary.uuid, entityName: note.name, entityUuid: note.uuid, ...payload },
  } as any);
}

/** `[uuid, motto]` of the stored instances that hold the attribute (SQL reads a dropped-then-added column as null). */
async function storedMottos(): Promise<[string, unknown][]> {
  const rows = await store.getInstances("data", note.uuid);
  expectOk(rows, "getInstances of the notes");
  return ((rows as any).returnedDomainElement.instances as Record<string, unknown>[])
    .filter((row) => row[MOTTO] !== undefined && row[MOTTO] !== null)
    .map((row): [string, unknown] => [String(row.uuid), row[MOTTO]])
    .sort(([a], [b]) => a.localeCompare(b));
}

async function storedNoteRow(): Promise<Entity> {
  const rows = await store.getInstances("model", entityEntity.uuid);
  expectOk(rows, "getInstances of the Entity rows");
  return ((rows as any).returnedDomainElement.instances as Entity[]).find((row) => row.uuid === note.uuid)!;
}

// ################################################################################################
describe(`alterEntityAttribute removeColumns removes the values from the instances (#733), store ${storeType}`, () => {
  beforeAll(async () => {
    const session = new AppStackIntegrationTestSession(miroirConfig as any, {
      applicationDeploymentMap,
      adminDeployment,
      libraryDeploymentStorageConfiguration,
    } as any);
    const executionEnvironment = await session.initSession();
    domainController = executionEnvironment.domainController;
    const libraryStore = executionEnvironment.persistenceStoreControllerManager.getPersistenceStoreController(
      deployment_Library_DO_NO_USE.uuid,
    );
    if (!libraryStore) {
      throw new Error("alterEntityAttributeRemoveColumns: no store controller for the Library deployment");
    }
    store = libraryStore;
  }, globalTimeOut);

  beforeEach(async () => {
    await resetIntegTestbed({
      domainController,
      applicationDeploymentMap,
      libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
      librarySelfApplicationUuid: selfApplicationLibrary.uuid,
      deploymentsToReset: selfApplicationDeploymentConfigurationsTO_REMOVE,
    });
  }, globalTimeOut);

  afterAll(async () => {
    await domainController.handleCompositeAction(
      testUtils_deleteApplicationDeployment(miroirConfig as any, selfApplicationLibrary.uuid, deployment_Library_DO_NO_USE.uuid),
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {},
    );
  }, globalTimeOut);

  // ##############################################################################################
  it(
    "removeColumns removes the attribute from every instance; an instance without it is kept as it was",
    async () => {
      expectOk(await store.createEntity(note), "createEntity");
      for (const instance of [noteInstance("01", "first motto"), noteInstance("02", "second motto"), noteInstance("03")]) {
        expectOk(await store.upsertInstance("data", instance), `upsertInstance ${instance.uuid}`);
      }
      expect(await storedMottos()).toHaveLength(2);

      expectOk(await alter({ removeColumns: [MOTTO] }), "removeColumns");

      expect(MOTTO in (await storedNoteRow()).mlSchema.definition).toBe(false);
      expect(await storedMottos()).toEqual([]);
      const rows = await store.getInstances("data", note.uuid);
      expect(((rows as any).returnedDomainElement.instances as EntityInstance[]).map((row) => row.uuid).sort()).toEqual(
        ["01", "02", "03"].map((suffix) => noteInstance(suffix).uuid),
      );
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it(
    "an attribute added again after its removal, with another type, finds no old value",
    async () => {
      expectOk(await store.createEntity(note), "createEntity");
      expectOk(await store.upsertInstance("data", noteInstance("01", "a string motto")), "upsertInstance");
      expectOk(await alter({ removeColumns: [MOTTO] }), "removeColumns");

      expectOk(await alter({ addColumns: [{ name: MOTTO, definition: { type: "number", optional: true } }] }), "addColumns as a number");

      expect(await storedMottos()).toEqual([]);
    },
    globalTimeOut,
  );
  // ##############################################################################################
  it.runIf(storeType !== "sql")(
    "removing the primary key attribute fails before any write: the Entity row and the instances are kept",
    async () => {
      expectOk(await store.createEntity(note), "createEntity");
      expectOk(await store.upsertInstance("data", noteInstance("01", "a motto")), "upsertInstance");

      const result = await alter({ removeColumns: ["uuid"] });

      expect(result instanceof Action2Error ? result.errorContext?.reason : undefined, JSON.stringify(result)).toBe("primaryKeyAttribute");
      expect("uuid" in (await storedNoteRow()).mlSchema.definition).toBe(true);
      const rows = await store.getInstances("data", note.uuid);
      expect((rows as any).returnedDomainElement.instances).toEqual([expect.objectContaining({ uuid: noteInstance("01").uuid, [MOTTO]: "a motto" })]);
    },
    globalTimeOut,
  );
});
