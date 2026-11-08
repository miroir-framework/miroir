/**
 * #715: what a committed change to an Entity row does to the Entity's PostgreSQL data table.
 *
 * The Entity editor saves an Entity as an instance update of its row. Committed, that update upserts
 * the row in the Entity table and leaves the data table as it was: an attribute added this way gets
 * no column. Only `alterEntityAttribute` alters the data table (`sync({ alter: true })`). The #694
 * analysis (section 5.1, D2) relies on this; D2's add-only reconciliation will change it on purpose,
 * and this test with it.
 *
 * Not reachable through MiroirTest: it asserts the columns of a SQL table, which no query reads.
 * Needs PostgreSQL (sql profile):
 * ```bash
 * MIROIR_POSTGRES_PASSWORD=... npm run testByFile -w miroir-standalone-app -- entityRowUpdateSqlTable.integ --profile emulatedServer-sql
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import process from "process";
import { Sequelize } from "sequelize";

import type {
  ApplicationDeploymentMap,
  DomainAction,
  EndpointDefinition,
  Entity,
  LoggerOptions,
  MetaModel,
  SelfApplication,
  StoreUnitConfiguration,
} from "@miroir-framework/core";
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
} from "@miroir-framework/core";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "@miroir-framework/store-indexeddb";
import { miroirMongoDbStoreSectionStartup } from "@miroir-framework/store-mongodb";
import { miroirPostgresStoreSectionStartup } from "@miroir-framework/store-postgres";
import { deployment_Admin } from "@miroir-framework/core/admin";
import { defaultMiroirMetaModel, entityEntity } from "@miroir-framework/core/meta-model";
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
MiroirLoggerFactory.startRegisteredLoggers(miroirActivityTracker, miroirEventService, loglevelnext, loggerOptions);

const globalTimeOut = 60000;
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";

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

// A Library Entity that only this test creates.
const noteEntity: Entity = {
  uuid: "715a0001-0000-4000-8000-000000000001",
  parentName: entityEntity.name,
  parentUuid: entityEntity.uuid,
  selfApplication: testApplicationUuid,
  name: "Note715",
  conceptLevel: "Model",
  description: "#715: a note, to watch its data table",
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

let domainController: DomainControllerInterface;
let rawSql: Sequelize;

function libraryModelEnv() {
  return domainController.currentModelEnvironment(testApplicationUuid, applicationDeploymentMap);
}

async function run(action: DomainAction, label: string): Promise<void> {
  const result = await domainController.handleAction(action, applicationDeploymentMap, libraryModelEnv());
  expect(result instanceof Action2Error, `${label} failed: ${JSON.stringify(result)}`).toBe(false);
}

async function commitLibrary(): Promise<void> {
  await run({ actionType: "commit", endpoint: MODEL_ENDPOINT, payload: { application: testApplicationUuid } }, "commit");
}

async function noteColumns(): Promise<string[]> {
  const [rows] = await rawSql.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = :schema AND table_name = :table`,
    {
      replacements: {
        schema: (testDeploymentStorageConfiguration.data as { schema: string }).schema,
        table: noteEntity.name,
      },
    },
  );
  return (rows as { column_name: string }[]).map((row) => row.column_name).sort();
}

async function storedNoteAttributes(): Promise<string[]> {
  const [rows] = await rawSql.query(
    `SELECT "mlSchema" FROM "${(testDeploymentStorageConfiguration.model as { schema: string }).schema}"."Entity" WHERE uuid = :uuid`,
    { replacements: { uuid: noteEntity.uuid } },
  );
  const mlSchema = (rows as { mlSchema: { definition: Record<string, unknown> } }[])[0]?.mlSchema;
  return Object.keys(mlSchema?.definition ?? {}).sort();
}

// ################################################################################################
const describeSql = isSqlBackend ? describe : describe.skip;

describeSql("a committed Entity row update and the SQL data table (#715)", () => {
  beforeAll(async () => {
    rawSql = new Sequelize((testDeploymentStorageConfiguration.data as { connectionString: string }).connectionString, {
      logging: false,
    });

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
    domainController = (await session.initSession()).domainController;

    await run(
      createDeploymentCompositeAction(
        "library",
        testApplicationDeploymentUuid,
        testApplicationUuid,
        adminDeployment,
        testDeploymentStorageConfiguration,
      ),
      "createDeployment",
    );
    await run(
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
        { ...(defaultLibraryModelEnvironment.currentModel as MetaModel), entities: [] },
        [],
      ),
      "resetAndInitialize",
    );
    await run({ actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: testApplicationUuid } }, "rollback");

    // every case starts from Note715 created and committed, so that each one also runs alone (-t)
    await run(
      {
        actionType: "createEntity",
        endpoint: MODEL_ENDPOINT,
        payload: { application: testApplicationUuid, entities: [noteEntity] },
      } as DomainAction,
      "createEntity",
    );
    await commitLibrary();
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
    await rawSql.close();
  }, globalTimeOut);

  // ##############################################################################################
  it(
    "createEntity, committed, makes a table with one column per attribute",
    async () => {
      expect(await noteColumns()).toEqual(["name", "parentName", "parentUuid", "uuid"]);
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it(
    "an attribute added by an update of the Entity row, committed, gets no column",
    async () => {
      const noteWithIsbn = {
        ...noteEntity,
        mlSchema: {
          ...noteEntity.mlSchema,
          definition: { ...noteEntity.mlSchema.definition, isbn: { type: "string", optional: true } },
        },
      } as Entity;
      await run(
        {
          actionType: "transactionalInstanceAction",
          endpoint: DOMAIN_ENDPOINT,
          payload: {
            application: testApplicationUuid,
            instanceAction: {
              actionType: "updateInstance",
              endpoint: INSTANCE_ENDPOINT,
              payload: { application: testApplicationUuid, applicationSection: "model", objects: [noteWithIsbn] },
            },
          },
        } as DomainAction,
        "updateInstance of the Entity row",
      );
      await commitLibrary();

      // the Entity row holds the new attribute, its data table does not
      expect(await storedNoteAttributes()).toContain("isbn");
      expect(await noteColumns()).toEqual(["name", "parentName", "parentUuid", "uuid"]);
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it(
    "an attribute added by alterEntityAttribute, committed, gets its column",
    async () => {
      await run(
        {
          actionType: "alterEntityAttribute",
          endpoint: MODEL_ENDPOINT,
          payload: {
            application: testApplicationUuid,
            entityName: noteEntity.name,
            entityUuid: noteEntity.uuid,
            addColumns: [{ name: "pages", definition: { type: "number", optional: true } }],
          },
        } as DomainAction,
        "alterEntityAttribute",
      );
      await commitLibrary();

      expect(await noteColumns()).toContain("pages");
    },
    globalTimeOut,
  );
});
