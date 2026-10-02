/**
 * #175 — External SQL Entity without primary key (`idAttribute: false`).
 *
 * A table whose rows can repeat is declared as an External Entity with `idAttribute: false`.
 * After each refresh, the local cache holds exactly the table's current rows, duplicates included.
 *
 * Needs PostgreSQL (sql profile):
 * ```bash
 * MIROIR_ENV=test-sql MIROIR_POSTGRES_PASSWORD=... \
 *   npm run testByFile -w miroir-standalone-app -- PkLessExternalEntity.integ
 * ```
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import process from "process";
import { Sequelize } from "sequelize";

import type {
  ApplicationDeploymentMap,
  EndpointDefinition,
  Entity,
  EntityInstance,
  LoggerOptions,
  MetaModel,
  SelfApplication,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
  ConfigurationService,
  createDeploymentCompositeAction,
  defaultSelfApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resetAndinitializeDeploymentCompositeAction,
  testUtils_deleteApplicationDeployment,
  testUtils_resetApplicationDeployment,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { deployment_Admin } from "miroir-app-admin";
import { defaultMiroirMetaModel, entityEntity } from "miroir-app-miroir";
import {
  deployment_Library_DO_NO_USE,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-example-library";

import { miroirAppStartup } from "../../src/startup.js";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { DomainControllerIntegrationTestSession } from "../helpers/DomainControllerIntegrationTestSession.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const { miroirConfig, logConfig } = await loadTestConfigFiles(process.env);
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
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";

const testApplicationUuid = selfApplicationLibrary.uuid;
const testApplicationDeploymentUuid = deployment_Library_DO_NO_USE.uuid;

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [testApplicationUuid]: testApplicationDeploymentUuid,
};

function storageConfiguration(deploymentUuid: string): StoreUnitConfiguration {
  return miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[deploymentUuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[deploymentUuid];
}

const miroirDeploymentStorageConfiguration = storageConfiguration("10ff36f2-50a3-48d8-b80f-e48e5d13af8e");
const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: storageConfiguration(deployment_Admin.uuid),
};
const testDeploymentStorageConfiguration = storageConfiguration(testApplicationDeploymentUuid);
const isSqlBackend = testDeploymentStorageConfiguration?.data?.emulatedServerType === "sql";

const defaultLibraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  {} as EndpointDefinition,
  testApplicationDeploymentUuid,
);

// ################################################################################################
// The keyless table, outside any Miroir-managed schema.
const externalSchema = "test_175";
const pkLessRowsEntity: Entity = {
  uuid: "22275459-d657-48cc-b72e-834e2ba3947c",
  parentName: entityEntity.name,
  parentUuid: entityEntity.uuid,
  selfApplication: testApplicationUuid,
  name: "pk_less_rows",
  conceptLevel: "External",
  description: "rows without primary key, they can repeat (#175)",
  externalDataSource: { schema: externalSchema },
  idAttribute: false,
  mlSchema: {
    type: "object",
    definition: {
      label: { type: "string", optional: true },
      n: { type: "number", optional: true },
    },
  },
} as Entity;

let domainController: DomainControllerInterface;
let rawSql: Sequelize;

function libraryModelEnv() {
  return domainController.currentModelEnvironment(testApplicationUuid, applicationDeploymentMap);
}

async function refreshLibraryCache() {
  const result = await domainController.handleAction(
    {
      actionType: "rollback",
      endpoint: MODEL_ENDPOINT,
      payload: { application: testApplicationUuid },
    },
    applicationDeploymentMap,
    libraryModelEnv(),
  );
  expect(result instanceof Action2Error, `rollback failed: ${JSON.stringify(result)}`).toBe(false);
}

function cachedPkLessRows(): Record<string, EntityInstance> | undefined {
  return domainController.getDomainState()[testApplicationDeploymentUuid]?.data?.[pkLessRowsEntity.uuid];
}

// Rows sorted by label: a table without ORDER BY has no defined row order.
function rowValues(rows: Record<string, EntityInstance> | undefined) {
  return Object.values(rows ?? {})
    .map((row: any) => ({ label: row.label, n: row.n }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// ################################################################################################
const describeSql = isSqlBackend ? describe : describe.skip;

describeSql("PkLessExternalEntity.integ (#175)", () => {
  beforeAll(async () => {
    rawSql = new Sequelize((testDeploymentStorageConfiguration.data as { connectionString: string }).connectionString, {
      logging: false,
    });
    await rawSql.query(`DROP SCHEMA IF EXISTS ${externalSchema} CASCADE`);
    await rawSql.query(`CREATE SCHEMA ${externalSchema}`);
    await rawSql.query(`CREATE TABLE ${externalSchema}.pk_less_rows (label text, n int)`);

    const session = new DomainControllerIntegrationTestSession(
      miroirConfig,
      {
        applicationDeploymentMap,
        adminDeployment,
        miroirDeploymentStorageConfiguration,
        libraryDeploymentStorageConfiguration: testDeploymentStorageConfiguration,
        miroirActivityTracker,
        miroirEventService,
      },
      "miroirPlatform",
    );
    const executionEnvironment = await session.initSession();
    domainController = executionEnvironment.domainController;

    const createResult = await domainController.handleAction(
      createDeploymentCompositeAction(
        "library",
        testApplicationDeploymentUuid,
        testApplicationUuid,
        adminDeployment,
        testDeploymentStorageConfiguration,
      ),
      applicationDeploymentMap,
      libraryModelEnv(),
    );
    expect(createResult instanceof Action2Error, `createDeployment failed: ${JSON.stringify(createResult)}`).toBe(
      false,
    );
  }, globalTimeOut);

  beforeEach(async () => {
    await rawSql.query(`DELETE FROM ${externalSchema}.pk_less_rows`);
    await rawSql.query(`INSERT INTO ${externalSchema}.pk_less_rows VALUES ('a', 1), ('a', 1), ('b', 2)`);
    const resetResult = await domainController.handleAction(
      resetAndinitializeDeploymentCompositeAction(
        testApplicationUuid,
        testApplicationDeploymentUuid,
        {
          dataStoreType: "app",
          metaModel: defaultMiroirMetaModel,
          selfApplication: selfApplicationLibrary as SelfApplication,
          applicationModelBranch: selfApplicationModelBranchLibraryMasterBranch,
          applicationVersion: selfApplicationVersionLibraryInitialVersion,
        },
        [],
        {
          ...(defaultLibraryModelEnvironment.currentModel as MetaModel),
          entities: [pkLessRowsEntity],
        },
        [pkLessRowsEntity.uuid],
      ),
      applicationDeploymentMap,
      libraryModelEnv(),
    );
    expect(resetResult instanceof Action2Error, `reset failed: ${JSON.stringify(resetResult)}`).toBe(false);
  }, globalTimeOut);

  afterAll(async () => {
    await domainController.handleAction(
      testUtils_resetApplicationDeployment(testApplicationUuid),
      applicationDeploymentMap,
      libraryModelEnv(),
    );
    await domainController.handleAction(
      testUtils_deleteApplicationDeployment(miroirConfig, testApplicationUuid, testApplicationDeploymentUuid),
      applicationDeploymentMap,
      libraryModelEnv(),
    );
    await rawSql.query(`DROP SCHEMA IF EXISTS ${externalSchema} CASCADE`);
    await rawSql.close();
  }, globalTimeOut);

  // ##############################################################################################
  it(
    "a refresh loads every row, duplicates included, and a second refresh replaces them",
    async () => {
      await refreshLibraryCache();
      expect(rowValues(cachedPkLessRows())).toEqual([
        { label: "a", n: 1 },
        { label: "a", n: 1 },
        { label: "b", n: 2 },
      ]);

      await rawSql.query(`DELETE FROM ${externalSchema}.pk_less_rows WHERE label = 'b'`);
      await rawSql.query(`INSERT INTO ${externalSchema}.pk_less_rows VALUES ('c', 3)`);
      await refreshLibraryCache();
      expect(rowValues(cachedPkLessRows())).toEqual([
        { label: "a", n: 1 },
        { label: "a", n: 1 },
        { label: "c", n: 3 },
      ]);
    },
    globalTimeOut,
  );
  // ##############################################################################################
  it.each(["localCacheOrFail", "storage"] as const)(
    "an ordered query (%s) returns every row, identical rows included",
    async (queryExecutionStrategy) => {
      await refreshLibraryCache();
      const result: any = await domainController.handleBoxedExtractorOrQueryAction(
        {
          actionType: "runBoxedQueryAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: testApplicationUuid,
            applicationSection: "data",
            queryExecutionStrategy,
            query: {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: testApplicationUuid,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                rows: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  applicationSection: "data",
                  parentName: pkLessRowsEntity.name,
                  parentUuid: pkLessRowsEntity.uuid,
                  orderBy: { attributeName: "label", direction: "DESC" },
                },
              },
            },
          },
        } as any,
        applicationDeploymentMap,
        libraryModelEnv(),
      );
      expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
      const rows = result?.returnedDomainElement?.rows;
      expect(Object.values(rows ?? {}).map((row: any) => row.label), JSON.stringify(result)).toEqual(["b", "a", "a"]);
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it(
    "create, update and delete on an entity without primary key are refused, the cache is unchanged",
    async () => {
      await refreshLibraryCache();
      const before = cachedPkLessRows();
      const row = { parentUuid: pkLessRowsEntity.uuid, label: "z", n: 9 } as unknown as EntityInstance;
      for (const actionType of ["createInstance", "updateInstance", "deleteInstance"] as const) {
        const result = await domainController.handleAction(
          {
            actionType,
            endpoint: INSTANCE_ENDPOINT,
            payload: {
              application: testApplicationUuid,
              applicationSection: "data",
              parentUuid: pkLessRowsEntity.uuid,
              objects: [row],
            },
          } as any,
          applicationDeploymentMap,
          libraryModelEnv(),
        );
        expect(result instanceof Action2Error, `${actionType} should be refused`).toBe(true);
        expect((result as Action2Error).errorMessage).toBe(
          `${actionType} refused: entity pk_less_rows has no primary key (idAttribute: false), its instances are read-only`,
        );
      }
      expect(cachedPkLessRows()).toEqual(before);
    },
    globalTimeOut,
  );
});
