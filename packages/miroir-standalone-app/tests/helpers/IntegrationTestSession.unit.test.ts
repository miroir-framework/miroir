import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  defaultSelfApplicationDeploymentMap,
  type DomainControllerInterface,
} from "miroir-core";
import { deployment_Admin } from "miroir-app-admin";

const setupMiroirDomainControllerMock = vi.fn();

vi.mock("miroir-localcache-redux", () => ({
  setupMiroirDomainController: (...args: unknown[]) => setupMiroirDomainControllerMock(...args),
}));

vi.mock("miroir-store-postgres", () => ({
  miroirPostgresStoreSectionStartup: vi.fn(),
}));

vi.mock("miroir-store-filesystem", () => ({
  miroirFileSystemStoreSectionStartup: vi.fn(),
}));

vi.mock("miroir-store-indexedDb", () => ({
  miroirIndexedDbStoreSectionStartup: vi.fn(),
}));

vi.mock("miroir-store-mongodb", () => ({
  miroirMongoDbStoreSectionStartup: vi.fn(),
}));

vi.mock("miroir-store-bundled", () => ({
  miroirBundledStoreSectionStartup: vi.fn(),
}));

vi.mock("miroir-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-core")>();
  return {
    ...actual,
    PersistenceStoreControllerManager: vi.fn().mockImplementation(() => ({
      addPersistenceStoreController: vi.fn().mockResolvedValue({ status: "ok" }),
      getPersistenceStoreController: vi.fn().mockReturnValue({
        createStore: vi.fn().mockResolvedValue({ status: "ok" }),
        open: vi.fn().mockResolvedValue({ status: "ok" }),
        initApplication: vi.fn().mockResolvedValue({ status: "ok" }),
      }),
    })),
  };
});

import { miroirBundledStoreSectionStartup } from "miroir-store-bundled";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import {
  INTEG_TEST_APPLICATION_NAME,
  INTEG_TEST_DEPLOYMENT_UUID,
  INTEG_TEST_SELF_APPLICATION_UUID,
  IntegrationTestSession,
  buildAdminStoreUnitConfiguration,
  buildIntegrationTestModelEnvironment,
  buildTestApplicationStoreUnitConfiguration,
  collectStoreUnitConfigurationServerTypes,
  resolveTestSessionForIntegOptionsFromEnv,
} from "./IntegrationTestSession.js";
import { resolveRepoRoot } from "./integrationTestProfiles.js";

/** The Admin copy of the test-sql environment, relative to the repository root. */
const TEST_SQL_ADMIN = {
  emulatedServerType: "filesystem" as const,
  directories: {
    admin: ".miroir/test-sql/admin",
    model: ".miroir/test-sql/admin/model",
    data: ".miroir/test-sql/admin/data",
  },
  filesystemDeploymentRootDirectory: resolveRepoRoot(),
};

function createMockDomainController(): DomainControllerInterface {
  return {
    handleCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    handleAction: vi.fn().mockResolvedValue({ status: "ok" }),
    getLocalCache: vi.fn(),
  } as unknown as DomainControllerInterface;
}

describe("IntegrationTestSession store configuration", () => {
  it("builds sql test application store with test schema on admin section", () => {
    const config = buildTestApplicationStoreUnitConfiguration(INTEG_TEST_APPLICATION_NAME, {
      emulatedServerType: "sql",
      postgresHostName: "127.0.0.1",
    });
    expect(config.admin.schema).toBe(INTEG_TEST_APPLICATION_NAME);
    expect(config.model.schema).toBe(INTEG_TEST_APPLICATION_NAME);
    expect(config.data.schema).toBe(INTEG_TEST_APPLICATION_NAME);
  });

  it("builds filesystem test application store under application root", () => {
    const config = buildTestApplicationStoreUnitConfiguration(INTEG_TEST_APPLICATION_NAME, {
      emulatedServerType: "filesystem",
      applicationRootDirectory: "tests/tmp/testApplication",
    });
    expect(config.model.directory).toBe("tests/tmp/testApplication/testApplication_model");
    expect(config.data.directory).toBe("tests/tmp/testApplication/testApplication_data");
  });

  it("builds indexedDb test application store", () => {
    const config = buildTestApplicationStoreUnitConfiguration(INTEG_TEST_APPLICATION_NAME, {
      emulatedServerType: "indexedDb",
      rootIndexDbName: "miroirTestApp",
    });
    expect(config.model.indexedDbName).toBe("miroirTestApp_model");
    expect(config.data.indexedDbName).toBe("miroirTestApp_data");
  });

  it("builds mongodb test application store", () => {
    const config = buildTestApplicationStoreUnitConfiguration(INTEG_TEST_APPLICATION_NAME, {
      emulatedServerType: "mongodb",
      connectionString: "mongodb://127.0.0.1:27017",
      database: "testApplication",
    });
    expect(config.model.emulatedServerType).toBe("mongodb");
    expect(config.data.database).toBe("testApplication");
  });

  it("builds filesystem admin store from the section directories, relative to the filesystem root", () => {
    const config = buildAdminStoreUnitConfiguration({
      ...TEST_SQL_ADMIN,
      directories: { ...TEST_SQL_ADMIN.directories, admin: `${resolveRepoRoot()}/.miroir/test-sql/admin` },
    });
    expect(config.admin.directory).toBe(".miroir/test-sql/admin");
    expect(config.model.directory).toBe(".miroir/test-sql/admin/model");
    expect(config.data.directory).toBe(".miroir/test-sql/admin/data");
  });

  it("builds bundled admin store for deployment_Admin", () => {
    const config = buildAdminStoreUnitConfiguration({
      emulatedServerType: "bundled",
      deploymentUuid: deployment_Admin.uuid,
    });
    expect(config.admin).toEqual({
      emulatedServerType: "bundled",
      deploymentUuid: deployment_Admin.uuid,
    });
    expect(config.model.emulatedServerType).toBe("bundled");
    expect(config.data.emulatedServerType).toBe("bundled");
  });

  it("collectStoreUnitConfigurationServerTypes gathers all section server types", () => {
    const types = collectStoreUnitConfigurationServerTypes(
      buildTestApplicationStoreUnitConfiguration(INTEG_TEST_APPLICATION_NAME, {
        emulatedServerType: "sql",
        postgresHostName: "127.0.0.1",
      }),
      buildAdminStoreUnitConfiguration(TEST_SQL_ADMIN),
    );
    expect(types).toEqual(new Set(["sql", "filesystem"]));
  });

  it("resolveTestSessionForIntegOptionsFromEnv without a profile runs on test-sql: Postgres on localhost, the environment's Admin (#321)", () => {
    const options = resolveTestSessionForIntegOptionsFromEnv({});

    expect(options.testApplicationStore.emulatedServerType).toBe("sql");
    expect("connectionString" in options.testApplicationStore && options.testApplicationStore.connectionString).toMatch(
      /^postgres:\/\/postgres(:[^@]*)?@localhost:5432\/postgres$/,
    );
    expect(options.adminStore).toEqual(TEST_SQL_ADMIN);
    expect(options.filesystemDeploymentRootDirectory).toBe(resolveRepoRoot());
  });

  it("resolveTestSessionForIntegOptionsFromEnv: MIROIR_TEST_POSTGRES_HOST replaces the environment's host", () => {
    const options = resolveTestSessionForIntegOptionsFromEnv({ MIROIR_TEST_POSTGRES_HOST: "10.0.0.5" });

    expect("connectionString" in options.testApplicationStore && options.testApplicationStore.connectionString).toMatch(
      /@10\.0\.0\.5:5432\/postgres$/,
    );
  });

  it("resolveTestSessionForIntegOptionsFromEnv puts a filesystem test application next to the environment's Admin", () => {
    expect(
      resolveTestSessionForIntegOptionsFromEnv({ MIROIR_ENV: "test-filesystem" }).testApplicationStore,
    ).toEqual({
      emulatedServerType: "filesystem",
      applicationRootDirectory: ".miroir/test-filesystem/testApplication",
    });
    expect(
      resolveTestSessionForIntegOptionsFromEnv({ MIROIR_TEST_APP_STORE_TYPE: "filesystem" }).testApplicationStore,
    ).toEqual({
      emulatedServerType: "filesystem",
      applicationRootDirectory: ".miroir/test-sql/testApplication",
    });
  });

  // #477: a parallel nonreg worker puts its test application in its own state and databases.
  it("resolveTestSessionForIntegOptionsFromEnv names the test application after the worker state", () => {
    expect(
      resolveTestSessionForIntegOptionsFromEnv({ MIROIR_ENV: "test-filesystem", MIROIR_TEST_WORKER: "w2" }).testApplicationStore,
    ).toEqual({
      emulatedServerType: "filesystem",
      applicationRootDirectory: ".miroir/test-filesystem@w2/testApplication",
    });
    expect(
      resolveTestSessionForIntegOptionsFromEnv({ MIROIR_ENV: "test-sql", MIROIR_TEST_WORKER: "w2" }).testApplicationStore,
    ).toMatchObject({ emulatedServerType: "sql", schema: "test_sql_w2_testApplication" });
    expect(
      resolveTestSessionForIntegOptionsFromEnv({ MIROIR_ENV: "test-mongodb", MIROIR_TEST_WORKER: "w2" }).testApplicationStore,
    ).toMatchObject({ emulatedServerType: "mongodb", database: "test_mongodb_w2_testApplication" });
  });

  it("buildTestApplicationStoreUnitConfiguration uses the schema it is given for every sql section", () => {
    const config = buildTestApplicationStoreUnitConfiguration(INTEG_TEST_APPLICATION_NAME, {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres@localhost:5432/postgres",
      schema: "test_sql_w2_testApplication",
    });

    expect(config.admin).toMatchObject({ schema: "test_sql_w2_testApplication" });
    expect(config.model).toMatchObject({ schema: "test_sql_w2_testApplication" });
    expect(config.data).toMatchObject({ schema: "test_sql_w2_testApplication" });
  });

  it("resolveTestSessionForIntegOptionsFromEnv ignores a MIROIR_ENV that is not a test environment", () => {
    expect(resolveTestSessionForIntegOptionsFromEnv({ MIROIR_ENV: "dev" }).adminStore).toEqual(TEST_SQL_ADMIN);
  });
});

describe("IntegrationTestSession session lifecycle", () => {
  beforeEach(() => {
    setupMiroirDomainControllerMock.mockReset();
    vi.mocked(miroirPostgresStoreSectionStartup).mockClear();
    vi.mocked(miroirFileSystemStoreSectionStartup).mockClear();
    vi.mocked(miroirIndexedDbStoreSectionStartup).mockClear();
    vi.mocked(miroirMongoDbStoreSectionStartup).mockClear();
    vi.mocked(miroirBundledStoreSectionStartup).mockClear();
  });

  it("initSession wires domainController and seeds data via handleAction", async () => {
    const domainController = createMockDomainController();
    setupMiroirDomainControllerMock.mockReturnValue(domainController);

    const session = new IntegrationTestSession({
      testApplicationStore: { emulatedServerType: "sql", postgresHostName: "127.0.0.1" },
      adminStore: TEST_SQL_ADMIN,
    });
    const env = await session.initSession();

    expect(setupMiroirDomainControllerMock).toHaveBeenCalledTimes(1);
    expect(domainController.handleAction).toHaveBeenCalledTimes(4);
    expect(env.domainController).toBe(domainController);
    expect(env.testApplicationUuid).toBe(INTEG_TEST_SELF_APPLICATION_UUID);
    expect(env.persistenceStoreControllerManager).toBeDefined();
    expect(
      env.persistenceStoreControllerManager.getPersistenceStoreController(INTEG_TEST_DEPLOYMENT_UUID),
    ).toBeDefined();
    expect(env.applicationDeploymentMap).toEqual({
      ...defaultSelfApplicationDeploymentMap,
      [INTEG_TEST_SELF_APPLICATION_UUID]: INTEG_TEST_DEPLOYMENT_UUID,
    });
    expect(miroirPostgresStoreSectionStartup).toHaveBeenCalledTimes(1);
    expect(miroirFileSystemStoreSectionStartup).toHaveBeenCalledTimes(1);
  });

  it("registers bundled startup when admin store is bundled", async () => {
    const domainController = createMockDomainController();
    setupMiroirDomainControllerMock.mockReturnValue(domainController);

    const session = new IntegrationTestSession({
      testApplicationStore: { emulatedServerType: "sql", postgresHostName: "127.0.0.1" },
      adminStore: { emulatedServerType: "bundled", deploymentUuid: deployment_Admin.uuid },
      bundledDeploymentData: {
        [deployment_Admin.uuid]: { admin: {}, model: {}, data: {} },
      },
    });
    await session.initSession();

    expect(miroirBundledStoreSectionStartup).toHaveBeenCalledTimes(1);
  });

  it("beforeEach re-seeds application data via handleAction", async () => {
    const domainController = createMockDomainController();
    setupMiroirDomainControllerMock.mockReturnValue(domainController);

    const session = new IntegrationTestSession({
      testApplicationStore: { emulatedServerType: "sql", postgresHostName: "127.0.0.1" },
      adminStore: TEST_SQL_ADMIN,
    });
    await session.initSession();
    vi.mocked(domainController.handleAction).mockClear();

    await session.beforeEach();

    expect(domainController.handleAction).toHaveBeenCalledTimes(4);
  });

  it("teardown drops deployment via composite action", async () => {
    const domainController = createMockDomainController();
    setupMiroirDomainControllerMock.mockReturnValue(domainController);

    const session = new IntegrationTestSession({
      testApplicationStore: { emulatedServerType: "sql", postgresHostName: "127.0.0.1" },
      adminStore: TEST_SQL_ADMIN,
    });
    await session.initSession();
    vi.mocked(domainController.handleCompositeAction).mockClear();

    await session.teardown();

    expect(domainController.handleCompositeAction).toHaveBeenCalledTimes(1);
    const [, , modelEnvironmentArg] = vi.mocked(domainController.handleCompositeAction).mock.calls[0]!;
    expect(modelEnvironmentArg).toEqual(buildIntegrationTestModelEnvironment());
  });
});
