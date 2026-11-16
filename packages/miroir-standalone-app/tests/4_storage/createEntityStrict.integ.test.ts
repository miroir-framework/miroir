/**
 * #745 (D4): `createEntity` on a store where the Entity's row or its storage already exists.
 *
 * Under the strict strategy of #694, `createEntity` fails with `entityExists` when the Entity row
 * exists and with `storageExists` when only the storage exists, leaving the storage and its
 * instances as they were and writing no row. `createEntities` checks every Entity before creating
 * any. External Entities have no storage: their row is upserted. A storage creation that fails
 * writes no row: `strictEntityCreation.unit.test.ts` in core, since no store fails on demand.
 *
 * Not reachable through MiroirTest: it writes to the store controller directly and checks the
 * store's own storage. Run it per store profile:
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict
 * MIROIR_ENV=test-sql MIROIR_POSTGRES_PASSWORD=... npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict
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
  ENTITY_CREATION_REFUSALS,
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

// Entities that only this test creates.
function noteEntity(uuidSuffix: string, name: string): Entity {
  return {
    uuid: `745a0001-0000-4000-8000-0000000000${uuidSuffix}`,
    parentName: entityEntity.name,
    parentUuid: entityEntity.uuid,
    selfApplication: selfApplicationLibrary.uuid,
    name,
    conceptLevel: "Model",
    description: "#745: an Entity created twice",
    mlSchema: {
      type: "object",
      definition: {
        uuid: { type: "uuid" },
        parentName: { type: "string", optional: true },
        parentUuid: { type: "uuid" },
        name: { type: "string" },
      },
    },
  } as Entity;
}

const note = noteEntity("01", "Note745");
// an Endpoint uuid: the store does not read it, an external Entity's row only names it
const EXTERNAL_ENDPOINT = "745a0002-0000-4000-8000-000000000001";
const secondNote = noteEntity("02", "SecondNote745");

function noteInstance(entity: Entity, suffix: string): EntityInstance {
  return {
    uuid: `745b0001-0000-4000-8000-0000000000${suffix}`,
    parentUuid: entity.uuid,
    parentName: entity.name,
    name: `note ${suffix}`,
  } as EntityInstance;
}

let domainController: DomainControllerInterface;
let store: PersistenceStoreControllerInterface;

function expectOk(result: unknown, label: string): void {
  expect(result instanceof Action2Error, `${label} failed: ${JSON.stringify(result)}`).toBe(false);
}

async function entityRowUuids(): Promise<string[]> {
  const rows = await store.getInstances("model", entityEntity.uuid);
  expectOk(rows, "getInstances of the Entity rows");
  return ((rows as any).returnedDomainElement.instances as EntityInstance[]).map((row) => row.uuid);
}

/** The physical probe of the store's data section (#745 D4). */
function storageExists(entity: Entity): Promise<boolean> {
  return (store as any).dataStoreSection.storageSpaceExists(entity);
}

function refusalReason(result: unknown): string | undefined {
  return result instanceof Action2Error ? result.errorContext?.reason : undefined;
}

async function storedInstanceUuids(entity: Entity): Promise<string[] | Action2Error> {
  const rows = await store.getInstances("data", entity.uuid);
  if (rows instanceof Action2Error) {
    return rows;
  }
  return ((rows as any).returnedDomainElement.instances as EntityInstance[]).map((row) => row.uuid).sort();
}

/** The Entity created, given one instance, then its row deleted: its storage is left behind. */
async function leaveStorageBehind(entity: Entity): Promise<void> {
  expectOk(await store.createEntity(entity), "first createEntity");
  expectOk(await store.upsertInstance("data", noteInstance(entity, "01")), "upsertInstance");
  expectOk(await store.deleteInstance("model", entity, entityEntity.uuid), "deleteInstance of the Entity row");
  expect(await entityRowUuids()).not.toContain(entity.uuid);
}

// ################################################################################################
describe(`createEntity where the Entity or its storage exists (#745 D4), store ${storeType}`, () => {
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
      throw new Error("createEntityStrict: no store controller for the Library deployment");
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
    "createEntity where only the storage exists fails with storageExists; the storage and its instances are kept, no row is written",
    async () => {
      await leaveStorageBehind(note);

      const result = await store.createEntity(note);

      expect(refusalReason(result), JSON.stringify(result)).toBe(ENTITY_CREATION_REFUSALS.storageExists);
      expect(await entityRowUuids()).not.toContain(note.uuid);
      expect(await storedInstanceUuids(note)).toEqual([noteInstance(note, "01").uuid]);
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it(
    "createEntity where the row exists fails with entityExists; the instances are kept",
    async () => {
      expectOk(await store.createEntity(note), "first createEntity");
      expectOk(await store.upsertInstance("data", noteInstance(note, "01")), "upsertInstance");

      const result = await store.createEntity(note);

      expect(refusalReason(result), JSON.stringify(result)).toBe(ENTITY_CREATION_REFUSALS.entityExists);
      expect(await storedInstanceUuids(note)).toEqual([noteInstance(note, "01").uuid]);
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it(
    "createEntities of two Entities, the second existing, fails and creates neither",
    async () => {
      expectOk(await store.createEntity(secondNote), "createEntity of the second");

      const result = await store.createEntities([note, secondNote]);

      expect(refusalReason(result), JSON.stringify(result)).toBe(ENTITY_CREATION_REFUSALS.entityExists);
      expect(await entityRowUuids()).not.toContain(note.uuid);
      expect(await storageExists(note)).toBe(false);
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it(
    "an external Entity served by an Endpoint has no storage: created twice, its row is written again",
    async () => {
      const external = { ...noteEntity("03", "ExternalNote745"), externalDataSource: { kind: "http", endpoint: EXTERNAL_ENDPOINT } } as Entity;

      expectOk(await store.createEntity(external), "first createEntity");
      expectOk(await store.createEntity(external), "second createEntity");

      expect(await entityRowUuids()).toContain(external.uuid);
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it.runIf(storeType === "indexedDb")(
    "IndexedDB: a sublevel the store did not register, holding a key, is storage that exists",
    async () => {
      // written through the store's own Level handle: Level locks its directory
      const indexedDb = (store as any).dataStoreSection.localUuidIndexedDb;
      await indexedDb.db.sublevel(note.uuid).put("orphan", { uuid: "orphan" }, { valueEncoding: "json" });
      expect(indexedDb.getSubLevels()).not.toContain(note.uuid);

      const result = await store.createEntity(note);

      expect(refusalReason(result), JSON.stringify(result)).toBe(ENTITY_CREATION_REFUSALS.storageExists);
      expect(await entityRowUuids()).not.toContain(note.uuid);
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it.runIf(storeType === "sql")(
    "SQL: a reset drops the tables of the schema no Entity registers; the model section's Entity table is still read",
    async () => {
      const dataSection = (store as any).dataStoreSection;
      await dataSection.sequelize.query(`CREATE TABLE "${dataSection.schema}"."${note.name}" (uuid uuid PRIMARY KEY)`);
      expect(await storageExists(note)).toBe(true);
      expect(refusalReason(await store.createEntity(note))).toBe(ENTITY_CREATION_REFUSALS.storageExists);

      // the clear of a reset drops the orphan table itself (the testbed reset below also recreates the schema)
      expectOk(await store.clear(), "clear");
      expect(await storageExists(note)).toBe(false);

      await resetIntegTestbed({
        domainController,
        applicationDeploymentMap,
        libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
        librarySelfApplicationUuid: selfApplicationLibrary.uuid,
        deploymentsToReset: selfApplicationDeploymentConfigurationsTO_REMOVE,
      });

      expect(await storageExists(note)).toBe(false);
      // the Entity table of the model section is there again: it reads (an Entity table no section registers
      // would have been dropped)
      expect(await entityRowUuids()).not.toContain(note.uuid);
      expectOk(await store.createEntity(note), "createEntity after the reset");
    },
    globalTimeOut,
  );
});
