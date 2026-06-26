import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  MiroirConfigClient,
  PersistenceStoreControllerManagerInterface,
} from "miroir-core";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-test-app_deployment-library";

import {
  runAppStackIntegrationBootstrap,
  type AppStackBootstrapOptions,
} from "./appStackIntegrationBootstrap.js";

const setupMiroirTestMock = vi.fn();
const createMiroirDeploymentGetPersistenceStoreControllerMock = vi.fn();
const createDeploymentCompositeActionMock = vi.fn();
const ensureLibraryPlayfieldMock = vi.fn();

vi.mock("../../src/miroir-fwk/4-tests/setupMiroirTest.js", () => ({
  setupMiroirTest: (...args: unknown[]) => setupMiroirTestMock(...args),
}));

vi.mock("../../src/miroir-fwk/4-tests/tests-utils.js", () => ({
  createMiroirDeploymentGetPersistenceStoreController: (...args: unknown[]) =>
    createMiroirDeploymentGetPersistenceStoreControllerMock(...args),
}));

vi.mock("miroir-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-core")>();
  return {
    ...actual,
    createDeploymentCompositeAction: (...args: unknown[]) =>
      createDeploymentCompositeActionMock(...args),
    ensureLibraryPlayfield: (...args: unknown[]) => ensureLibraryPlayfieldMock(...args),
    resetAndInitApplicationDeployment: vi.fn().mockResolvedValue({ status: "ok" }),
  };
});

import { resetAndInitApplicationDeployment } from "miroir-core";

function createMockDomainController(): DomainControllerInterface {
  return {
    handleCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    handleAction: vi.fn().mockResolvedValue({ status: "ok" }),
    getLocalCache: vi.fn(),
  } as unknown as DomainControllerInterface;
}

function createMockManager(): PersistenceStoreControllerManagerInterface {
  return {
    getPersistenceStoreController: vi.fn().mockReturnValue({}),
  } as unknown as PersistenceStoreControllerManagerInterface;
}

function baseMiroirConfig(): MiroirConfigClient {
  return {
    miroirConfigType: "client",
    client: {
      emulateServer: true,
      rootApiUrl: "http://localhost",
      filesystemDeploymentRootDirectory: "/tmp/miroir-test",
      deploymentStorageConfig: {},
    },
  };
}

const applicationDeploymentMap = {} as ApplicationDeploymentMap;
const adminDeployment = { uuid: "admin-uuid", selfApplication: "admin-app" } as any;
const libraryDeploymentStorageConfiguration = { model: {}, data: {}, admin: {} } as any;
const miroirDeploymentStorageConfiguration = {
  model: { emulatedServerType: "sql" },
  data: { emulatedServerType: "sql" },
  admin: { emulatedServerType: "sql" },
} as any;

function explicitBootstrapOptions(
  overrides: Partial<AppStackBootstrapOptions> = {},
): AppStackBootstrapOptions {
  return {
    miroirConfig: baseMiroirConfig(),
    applicationDeploymentMap,
    adminDeployment,
    phases: ["wireEmulatedStack", "deployMiroir", "deployLibrary"],
    libraryDeploymentStorageConfiguration,
    testApplicationUuid: selfApplicationLibrary.uuid,
    deployMiroirStrategy: "pscHelper",
    openAdminAndMiroirStoresOnServer: false,
    customFetch: fetch,
    ...overrides,
  };
}

describe("runAppStackIntegrationBootstrap (Gap E B1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const domainController = createMockDomainController();
    const manager = createMockManager();
    setupMiroirTestMock.mockResolvedValue({
      domainControllerForClient: domainController,
      domainControllerForServer: domainController,
      persistenceStoreControllerManagerForServer: manager,
    });
    createMiroirDeploymentGetPersistenceStoreControllerMock.mockResolvedValue({
      localMiroirPersistenceStoreController: {},
    });
    createDeploymentCompositeActionMock.mockImplementation(
      (kind: string, deploymentUuid: string) => ({
        actionType: "compositeAction",
        kind,
        deploymentUuid,
      }),
    );
    ensureLibraryPlayfieldMock.mockResolvedValue({ created: true });
  });

  it("wireEmulatedStack calls setupMiroirTest once", async () => {
    await runAppStackIntegrationBootstrap(explicitBootstrapOptions());

    expect(setupMiroirTestMock).toHaveBeenCalledTimes(1);
  });

  it("deployLibrary calls ensureLibraryPlayfield for library deployment", async () => {
    const manager = createMockManager();
    setupMiroirTestMock.mockResolvedValue({
      domainControllerForClient: createMockDomainController(),
      domainControllerForServer: createMockDomainController(),
      persistenceStoreControllerManagerForServer: manager,
    });

    await runAppStackIntegrationBootstrap(explicitBootstrapOptions());

    expect(ensureLibraryPlayfieldMock).toHaveBeenCalledWith(
      expect.objectContaining({
        libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
        librarySelfApplicationUuid: selfApplicationLibrary.uuid,
        adminDeployment,
        libraryDeploymentStorageConfiguration,
        mode: "createIfAbsent",
        persistenceStoreControllerManager: manager,
      }),
    );
    expect(createDeploymentCompositeActionMock).not.toHaveBeenCalledWith(
      "library",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it("skips deployMiroir when phase is absent", async () => {
    await runAppStackIntegrationBootstrap(
      explicitBootstrapOptions({
        phases: ["wireEmulatedStack", "deployLibrary"],
      }),
    );

    expect(createMiroirDeploymentGetPersistenceStoreControllerMock).not.toHaveBeenCalled();
    expect(ensureLibraryPlayfieldMock).toHaveBeenCalledTimes(1);
  });

  it("resetMiroirModel phase calls resetAndInitApplicationDeployment", async () => {
    await runAppStackIntegrationBootstrap(
      explicitBootstrapOptions({
        phases: ["wireEmulatedStack", "deployMiroir", "resetMiroirModel"],
      }),
    );

    expect(resetAndInitApplicationDeployment).toHaveBeenCalledTimes(1);
  });

  it("returns MiroirTestExecutionEnvironment shape", async () => {
    const manager = createMockManager();
    setupMiroirTestMock.mockResolvedValue({
      domainControllerForClient: createMockDomainController(),
      persistenceStoreControllerManagerForServer: manager,
    });

    const env = await runAppStackIntegrationBootstrap(
      explicitBootstrapOptions({
        testApplicationUuid: selfApplicationLibrary.uuid,
      }),
    );

    expect(env.domainController).toBeDefined();
    expect(env.applicationDeploymentMap).toBe(applicationDeploymentMap);
    expect(env.testApplicationUuid).toBe(selfApplicationLibrary.uuid);
    expect(env.persistenceStoreControllerManager).toBe(manager);
  });

  it("compositeAction deployMiroir requires explicit storage configuration and uuids", async () => {
    await expect(
      runAppStackIntegrationBootstrap(
        explicitBootstrapOptions({
          phases: ["wireEmulatedStack", "deployMiroir"],
          deployMiroirStrategy: "compositeAction",
        }),
      ),
    ).rejects.toThrow(/miroirDeploymentStorageConfiguration required/);
  });

  it("openAdminAndMiroirStoresOnServer passes test storage config for miroir openStore", async () => {
    const domainController = createMockDomainController();
    setupMiroirTestMock.mockResolvedValue({
      domainControllerForClient: domainController,
      domainControllerForServer: domainController,
      persistenceStoreControllerManagerForServer: createMockManager(),
    });

    await runAppStackIntegrationBootstrap(
      explicitBootstrapOptions({
        phases: ["wireEmulatedStack"],
        openAdminAndMiroirStoresOnServer: true,
        miroirDeploymentStorageConfiguration,
      }),
    );

    const openStoreCalls = vi
      .mocked(domainController.handleAction)
      .mock.calls.filter(
        ([action]) =>
          (action as { actionType?: string }).actionType ===
          "storeManagementAction_openStore",
      );
    expect(openStoreCalls).toHaveLength(2);
    const miroirOpenStorePayload = openStoreCalls[1]?.[0] as {
      payload?: { configuration?: Record<string, unknown> };
    };
    expect(
      Object.values(miroirOpenStorePayload.payload?.configuration ?? {})[0],
    ).toEqual(miroirDeploymentStorageConfiguration);
  });
});
