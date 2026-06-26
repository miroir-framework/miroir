import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  MiroirConfigClient,
  PersistenceStoreControllerManagerInterface,
} from "miroir-core";
import { getBootstrapPhasesForSessionKind } from "miroir-core";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-test-app_deployment-library";

import { runAppStackIntegrationBootstrap } from "./appStackIntegrationBootstrap.js";

const setupMiroirTestMock = vi.fn();
const createMiroirDeploymentGetPersistenceStoreControllerMock = vi.fn();
const createDeploymentCompositeActionMock = vi.fn();
const ensureLibraryPlayfieldMock = vi.fn();
const ensureMiroirPlatformMock = vi.fn();

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
    ensureMiroirPlatform: (...args: unknown[]) => ensureMiroirPlatformMock(...args),
    resetAndInitApplicationDeployment: vi.fn().mockResolvedValue({ status: "ok" }),
  };
});

function createHostDomainController(): DomainControllerInterface {
  return {
    handleCompositeAction: vi.fn().mockResolvedValue({ status: "ok" }),
    handleAction: vi.fn().mockResolvedValue({ status: "ok" }),
    getLocalCache: vi.fn(),
  } as unknown as DomainControllerInterface;
}

function createHostManager(): PersistenceStoreControllerManagerInterface {
  return {
    getPersistenceStoreController: vi.fn((uuid: string) => {
      if (uuid === deployment_Library_DO_NO_USE.uuid) {
        return {};
      }
      return {};
    }),
  } as unknown as PersistenceStoreControllerManagerInterface;
}

const applicationDeploymentMap = {} as ApplicationDeploymentMap;
const adminDeployment = { uuid: "admin-uuid", selfApplication: "admin-app" } as any;
const libraryDeploymentStorageConfiguration = { model: {}, data: {}, admin: {} } as any;

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

describe("embeddedIntegrationBootstrap (Gap A A5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureLibraryPlayfieldMock.mockResolvedValue({ created: false });
    ensureMiroirPlatformMock.mockResolvedValue({ created: false });
  });

  it("embedded host completes appStackPsc phases without setupMiroirTest or direct deploy helpers", async () => {
    const hostDomainController = createHostDomainController();
    const hostManager = createHostManager();

    const env = await runAppStackIntegrationBootstrap({
      miroirConfig: baseMiroirConfig(),
      applicationDeploymentMap,
      adminDeployment,
      phases: getBootstrapPhasesForSessionKind("appStackPsc"),
      libraryDeploymentStorageConfiguration,
      testApplicationUuid: selfApplicationLibrary.uuid,
      deployMiroirStrategy: "pscHelper",
      openAdminAndMiroirStoresOnServer: false,
      customFetch: fetch,
      hostMode: "embedded",
      platformEnsureMode: "requireExisting",
      libraryPlayfieldEnsureMode: "requireExisting",
      hostExecutionEnvironment: {
        domainController: hostDomainController,
        persistenceStoreControllerManager: hostManager,
        applicationDeploymentMap,
        testApplicationUuid: selfApplicationLibrary.uuid,
      },
    });

    expect(setupMiroirTestMock).not.toHaveBeenCalled();
    expect(createMiroirDeploymentGetPersistenceStoreControllerMock).not.toHaveBeenCalled();
    expect(createDeploymentCompositeActionMock).not.toHaveBeenCalled();
    expect(ensureMiroirPlatformMock).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "requireExisting" }),
    );
    expect(ensureLibraryPlayfieldMock).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "requireExisting" }),
    );
    expect(env.domainController).toBe(hostDomainController);
    expect(env.persistenceStoreControllerManager).toBe(hostManager);
  });

  it("embedded host with skipBootstrapPhases skips platform and library ensure", async () => {
    const hostDomainController = createHostDomainController();
    const hostManager = createHostManager();

    await runAppStackIntegrationBootstrap({
      miroirConfig: baseMiroirConfig(),
      applicationDeploymentMap,
      adminDeployment,
      phases: getBootstrapPhasesForSessionKind("appStackPsc"),
      libraryDeploymentStorageConfiguration,
      testApplicationUuid: selfApplicationLibrary.uuid,
      deployMiroirStrategy: "pscHelper",
      openAdminAndMiroirStoresOnServer: false,
      customFetch: fetch,
      hostMode: "embedded",
      skipBootstrapPhases: ["deployMiroir", "deployLibrary"],
      hostExecutionEnvironment: {
        domainController: hostDomainController,
        persistenceStoreControllerManager: hostManager,
        applicationDeploymentMap,
        testApplicationUuid: selfApplicationLibrary.uuid,
      },
    });

    expect(setupMiroirTestMock).not.toHaveBeenCalled();
    expect(ensureMiroirPlatformMock).not.toHaveBeenCalled();
    expect(ensureLibraryPlayfieldMock).not.toHaveBeenCalled();
  });
});
