import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  defaultSelfApplicationDeploymentMap,
  type DomainControllerInterface,
} from "miroir-core";

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

import {
  POSTGRES_TEST_APPLICATION_NAME,
  POSTGRES_TEST_DEPLOYMENT_UUID,
  POSTGRES_TEST_SELF_APPLICATION_UUID,
  TestSessionForPostgres,
  buildAdminFilesystemStoreConfig,
  buildTestPostgresStoreConfig,
  resolveDefaultAdminAssetsRoot,
  resolveDefaultFilesystemDeploymentRoot,
} from "./TestSessionForPostgres.js";

function createMockDomainController(): DomainControllerInterface {
  return {
    handleCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    handleAction: vi.fn().mockResolvedValue({ status: "ok" }),
    getLocalCache: vi.fn(),
  } as unknown as DomainControllerInterface;
}

describe("TestSessionForPostgres", () => {
  beforeEach(() => {
    setupMiroirDomainControllerMock.mockReset();
  });

  it("initSession wires domainController and seeds data via handleAction", async () => {
    const domainController = createMockDomainController();
    setupMiroirDomainControllerMock.mockReturnValue(domainController);

    const adapter = new TestSessionForPostgres({ postgresHostName: "127.0.0.1" });
    const env = await adapter.initSession();

    expect(setupMiroirDomainControllerMock).toHaveBeenCalledTimes(1);
    expect(domainController.handleAction).toHaveBeenCalledTimes(4);
    expect(env.domainController).toBe(domainController);
    expect(env.testApplicationUuid).toBe(POSTGRES_TEST_SELF_APPLICATION_UUID);
    expect(env.applicationDeploymentMap).toEqual({
      ...defaultSelfApplicationDeploymentMap,
      [POSTGRES_TEST_SELF_APPLICATION_UUID]: POSTGRES_TEST_DEPLOYMENT_UUID,
    });
  });

  it("beforeEach re-seeds application data via handleAction", async () => {
    const domainController = createMockDomainController();
    setupMiroirDomainControllerMock.mockReturnValue(domainController);

    const adapter = new TestSessionForPostgres({ postgresHostName: "127.0.0.1" });
    await adapter.initSession();
    vi.mocked(domainController.handleAction).mockClear();

    await adapter.beforeEach();

    expect(domainController.handleAction).toHaveBeenCalledTimes(4);
  });

  it("teardown drops deployment via composite action", async () => {
    const domainController = createMockDomainController();
    setupMiroirDomainControllerMock.mockReturnValue(domainController);

    const adapter = new TestSessionForPostgres({ postgresHostName: "127.0.0.1" });
    await adapter.initSession();
    vi.mocked(domainController.handleCompositeAction).mockClear();

    await adapter.teardown();

    expect(domainController.handleCompositeAction).toHaveBeenCalledTimes(1);
  });

  it("buildTestPostgresStoreConfig uses test schema for admin, not miroirAdmin", () => {
    const config = buildTestPostgresStoreConfig(POSTGRES_TEST_APPLICATION_NAME, "127.0.0.1");
    expect(config.admin.schema).toBe(POSTGRES_TEST_APPLICATION_NAME);
    expect(config.model.schema).toBe(POSTGRES_TEST_APPLICATION_NAME);
    expect(config.data.schema).toBe(POSTGRES_TEST_APPLICATION_NAME);
  });

  it("buildAdminFilesystemStoreConfig uses relative paths under filesystem root", () => {
    const filesystemRoot = resolveDefaultFilesystemDeploymentRoot();
    const adminAssetsRoot = resolveDefaultAdminAssetsRoot();
    const config = buildAdminFilesystemStoreConfig(adminAssetsRoot, filesystemRoot);
    expect(config.admin.directory).toBe("tests/assets/admin");
    expect(config.model.directory).toBe("tests/assets/admin_model");
    expect(config.data.directory).toBe("tests/assets/admin_data");
  });
});
