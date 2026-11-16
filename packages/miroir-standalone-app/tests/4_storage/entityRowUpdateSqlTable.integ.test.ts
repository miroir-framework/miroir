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
  PersistenceStoreControllerInterface,
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
import { miroirPostgresStoreSectionStartup, SQL_TABLE_REFUSALS } from "@miroir-framework/store-postgres";
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
let persistenceStoreControllerManager: any;
let rawSql: Sequelize;

/** The Library store controller: the store methods a model Action reaches, called directly. */
function libraryStore(): PersistenceStoreControllerInterface {
  return persistenceStoreControllerManager.getPersistenceStoreController(testApplicationDeploymentUuid);
}

function dataSchema(): string {
  return (testDeploymentStorageConfiguration.data as { schema: string }).schema;
}

function refusalReason(result: unknown): string | undefined {
  return result instanceof Action2Error ? result.errorContext?.reason : undefined;
}

function alterNote(payload: { addColumns?: { name: string; definition: unknown }[]; removeColumns?: string[] }) {
  return libraryStore().alterEntityAttribute({
    actionType: "alterEntityAttribute",
    endpoint: MODEL_ENDPOINT,
    payload: { application: testApplicationUuid, entityName: noteEntity.name, entityUuid: noteEntity.uuid, ...payload },
  } as any);
}

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

async function tableColumns(table: string): Promise<string[]> {
  const [rows] = await rawSql.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = :schema AND table_name = :table`,
    { replacements: { schema: dataSchema(), table } },
  );
  return (rows as { column_name: string }[]).map((row) => row.column_name).sort();
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
    const executionEnvironment = await session.initSession();
    domainController = executionEnvironment.domainController;
    persistenceStoreControllerManager = executionEnvironment.persistenceStoreControllerManager;

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
      // #745 D7: only the named column; isbn, in the Entity row since the case above, gets none
      expect(await noteColumns()).not.toContain("isbn");
    },
    globalTimeOut,
  );

  // ##############################################################################################
  // #745 D7: alterEntityAttribute and renameEntity change only what they name, checking first
  it(
    "alterEntityAttribute adds only the named column: a column the Entity row does not declare is kept, with its values",
    async () => {
      await rawSql.query(`ALTER TABLE "${dataSchema()}"."${noteEntity.name}" ADD COLUMN "kept745" text`);
      await rawSql.query(
        `INSERT INTO "${dataSchema()}"."${noteEntity.name}" (uuid, "parentUuid", name, "kept745") VALUES ('745d0001-0000-4000-8000-000000000001', :parent, 'n', 'kept value')`,
        { replacements: { parent: noteEntity.uuid } },
      );

      const result = await alterNote({ addColumns: [{ name: "added745", definition: { type: "string", optional: true } }] });

      expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
      expect(await noteColumns()).toEqual(expect.arrayContaining(["added745", "kept745"]));
      // isbn, declared by the Entity row with no column (above), gets none
      expect(await noteColumns()).not.toContain("isbn");
      const [rows] = await rawSql.query(`SELECT "kept745" FROM "${dataSchema()}"."${noteEntity.name}" WHERE uuid = '745d0001-0000-4000-8000-000000000001'`);
      expect(rows).toEqual([{ kept745: "kept value" }]);
      expect(await storedNoteAttributes()).toContain("added745");
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it(
    "alterEntityAttribute is refused, nothing changed: adding a column that exists (columnExists), removing one that does not (columnMissing); a virtual attribute has no column to check",
    async () => {
      const attributesBefore = await storedNoteAttributes();
      const columnsBefore = await noteColumns();

      const existing = await alterNote({ addColumns: [{ name: "kept745", definition: { type: "string", optional: true } }] });
      expect(refusalReason(existing), JSON.stringify(existing)).toBe(SQL_TABLE_REFUSALS.columnExists);
      expect((existing as Action2Error).errorContext).toMatchObject({ column: "kept745", entity: noteEntity.uuid });

      // isbn is declared by the Entity row, without a column
      const missing = await alterNote({ removeColumns: ["isbn"] });
      expect(refusalReason(missing), JSON.stringify(missing)).toBe(SQL_TABLE_REFUSALS.columnMissing);
      expect((missing as Action2Error).errorContext).toMatchObject({ column: "isbn" });

      // a column added with an existing one: neither is added
      const mixed = await alterNote({
        addColumns: [
          { name: "notAdded745", definition: { type: "string", optional: true } },
          { name: "added745", definition: { type: "string", optional: true } },
        ],
      });
      expect(refusalReason(mixed)).toBe(SQL_TABLE_REFUSALS.columnExists);
      expect(await noteColumns()).toEqual(columnsBefore);
      expect(await storedNoteAttributes()).toEqual(attributesBefore);

      // a virtual attribute: added and removed in the Entity row only
      const virtual = { type: "string", optional: true, tag: { value: { virtualAttribute: { transformerType: "returnValue", value: "v" } } } };
      const addedVirtual = await alterNote({ addColumns: [{ name: "virtual745", definition: virtual }] });
      expect(addedVirtual instanceof Action2Error, JSON.stringify(addedVirtual)).toBe(false);
      expect(await storedNoteAttributes()).toContain("virtual745");
      const removedVirtual = await alterNote({ removeColumns: ["virtual745"] });
      expect(removedVirtual instanceof Action2Error, JSON.stringify(removedVirtual)).toBe(false);
      expect(await noteColumns()).toEqual(columnsBefore);
    },
    globalTimeOut,
  );

  // ##############################################################################################
  it(
    "renameEntity to a name whose table exists is refused (tableExists), the row unchanged; a rename keeps the rows",
    async () => {
      const taken = "Taken745";
      await rawSql.query(`CREATE TABLE "${dataSchema()}"."${taken}" (uuid uuid PRIMARY KEY)`);
      const rename = (targetValue: string) =>
        libraryStore().renameEntityClean({
          actionType: "renameEntity",
          endpoint: MODEL_ENDPOINT,
          payload: { application: testApplicationUuid, entityName: noteEntity.name, entityUuid: noteEntity.uuid, targetValue },
        } as any);

      const refused = await rename(taken);
      expect(refusalReason(refused), JSON.stringify(refused)).toBe(SQL_TABLE_REFUSALS.tableExists);
      const [names] = await rawSql.query(
        `SELECT name FROM "${(testDeploymentStorageConfiguration.model as { schema: string }).schema}"."Entity" WHERE uuid = :uuid`,
        { replacements: { uuid: noteEntity.uuid } },
      );
      expect(names).toEqual([{ name: noteEntity.name }]);
      expect(await tableColumns(noteEntity.name)).toContain("kept745");

      const renamedTo = "Renamed745";
      const renamed = await rename(renamedTo);
      expect(renamed instanceof Action2Error, JSON.stringify(renamed)).toBe(false);
      const [rows] = await rawSql.query(`SELECT uuid FROM "${dataSchema()}"."${renamedTo}"`);
      expect(rows).toEqual([{ uuid: "745d0001-0000-4000-8000-000000000001" }]);
      expect(await tableColumns(noteEntity.name)).toEqual([]);
      // back to its name, for the other cases and the reset
      expect((await rename(noteEntity.name)) instanceof Action2Error).toBe(false);
      await rawSql.query(`DROP TABLE "${dataSchema()}"."${taken}"`);
    },
    globalTimeOut,
  );
});
