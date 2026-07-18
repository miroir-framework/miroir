import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  MiroirConfigClient,
  PersistenceStoreControllerManagerInterface,
} from "miroir-core";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const setupMiroirTestMock = vi.fn();
const ensureMiroirPlatformMock = vi.fn();

vi.mock("../../src/miroir-fwk/4-tests/setupMiroirTest.js", () => ({
  setupMiroirTest: (...args: unknown[]) => setupMiroirTestMock(...args),
}));

vi.mock("miroir-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("miroir-core")>();
  return {
    ...actual,
    ensureMiroirPlatform: (...args: unknown[]) => ensureMiroirPlatformMock(...args),
  };
});

import { runRealServerClientBootstrap } from "../../src/miroir-fwk/4-tests/runRealServerClientBootstrap.js";

function createMockDomainController(): DomainControllerInterface {
  return {
    handleCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    handleAction: vi.fn().mockResolvedValue({ status: "ok" }),
    getLocalCache: vi.fn(),
  } as unknown as DomainControllerInterface;
}

function createMockManager(): PersistenceStoreControllerManagerInterface {
  return {
    getPersistenceStoreController: vi.fn().mockReturnValue(undefined),
  } as unknown as PersistenceStoreControllerManagerInterface;
}

function realServerMiroirConfig(): MiroirConfigClient {
  return {
    miroirConfigType: "client",
    client: {
      emulateServer: false,
      serverConfig: {
        rootApiUrl: "https://localhost:3080",
        storeSectionConfiguration: {},
      },
    },
  } as MiroirConfigClient;
}

describe("runRealServerClientBootstrap (B6-c C1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMiroirTestMock.mockResolvedValue({
      domainControllerForClient: createMockDomainController(),
      domainControllerForServer: undefined,
      persistenceStoreControllerManagerForClient: createMockManager(),
      persistenceStoreControllerManagerForServer: undefined,
    });
    ensureMiroirPlatformMock.mockResolvedValue({ created: false });
  });

  it("rejects emulateServer: true configs", async () => {
    await expect(
      runRealServerClientBootstrap({
        miroirConfig: {
          miroirConfigType: "client",
          client: {
            emulateServer: true,
            rootApiUrl: "http://localhost",
            filesystemDeploymentRootDirectory: "/tmp",
            deploymentStorageConfig: {},
          },
        } as MiroirConfigClient,
        applicationDeploymentMap: {} as ApplicationDeploymentMap,
        adminDeployment: { uuid: "admin" } as any,
        testApplicationUuid: selfApplicationLibrary.uuid,
        customFetch: fetch,
      }),
    ).rejects.toThrow(/emulateServer: false/);
  });

  it("wires client-only stack via setupMiroirTest without requiring wireEmulatedStack", async () => {
    const domainController = createMockDomainController();
    const manager = createMockManager();
    setupMiroirTestMock.mockResolvedValueOnce({
      domainControllerForClient: domainController,
      domainControllerForServer: undefined,
      persistenceStoreControllerManagerForClient: manager,
      persistenceStoreControllerManagerForServer: undefined,
    });

    const result = await runRealServerClientBootstrap({
      miroirConfig: realServerMiroirConfig(),
      applicationDeploymentMap: { [selfApplicationLibrary.uuid]: "dep" } as ApplicationDeploymentMap,
      adminDeployment: { uuid: "admin" } as any,
      testApplicationUuid: selfApplicationLibrary.uuid,
      customFetch: fetch,
    });

    expect(setupMiroirTestMock).toHaveBeenCalledTimes(1);
    expect(result.domainController).toBe(domainController);
    expect(result.persistenceStoreControllerManager).toBe(manager);
    expect(result.testApplicationUuid).toBe(selfApplicationLibrary.uuid);
    // D9 default: do not create Miroir platform on shared server
    expect(ensureMiroirPlatformMock).not.toHaveBeenCalled();
  });

  it("calls ensureMiroirPlatform when platformEnsureMode is createIfAbsent", async () => {
    await runRealServerClientBootstrap({
      miroirConfig: realServerMiroirConfig(),
      applicationDeploymentMap: {} as ApplicationDeploymentMap,
      adminDeployment: { uuid: "admin" } as any,
      testApplicationUuid: selfApplicationLibrary.uuid,
      customFetch: fetch,
      platformEnsureMode: "createIfAbsent",
      miroirDeploymentStorageConfiguration: {
        admin: { emulatedServerType: "sql" },
        model: { emulatedServerType: "sql" },
        data: { emulatedServerType: "sql" },
      } as any,
      miroirDeploymentUuid: "miroir-dep",
      miroirSelfApplicationUuid: "miroir-app",
    });

    expect(ensureMiroirPlatformMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "createIfAbsent",
        deployStrategy: "compositeAction",
        miroirDeploymentUuid: "miroir-dep",
        skipOpenAdminStore: true,
      }),
    );
  });
});
