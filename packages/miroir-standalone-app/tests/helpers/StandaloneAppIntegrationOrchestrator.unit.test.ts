import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DomainControllerInterface, MiroirConfigClient } from "miroir-core";
import { getPlayfieldForSessionKind } from "miroir-core";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const runAppStackIntegrationBootstrapMock = vi.fn();

vi.mock("./appStackIntegrationBootstrap.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./appStackIntegrationBootstrap.js")>();
  return {
    ...actual,
    runAppStackIntegrationBootstrap: (...args: unknown[]) =>
      runAppStackIntegrationBootstrapMock(...args),
  };
});

import { createStandaloneAppIntegrationOrchestrator } from "./StandaloneAppIntegrationOrchestrator.js";

const miroirConfig = {
  client: { emulateServer: true },
} as MiroirConfigClient;

const appStackSessionOptions = {
  applicationDeploymentMap: {},
  adminDeployment: { uuid: "admin-uuid" },
  libraryDeploymentStorageConfiguration: { model: {}, data: {}, admin: {} },
} as any;

describe("StandaloneAppIntegrationOrchestrator (Gap B L7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runAppStackIntegrationBootstrapMock.mockResolvedValue({
      domainController: {} as DomainControllerInterface,
      applicationDeploymentMap: appStackSessionOptions.applicationDeploymentMap,
      testApplicationUuid: selfApplicationLibrary.uuid,
      persistenceStoreControllerManager: {},
    });
  });

  it("describeSession surfaces playfield for subprocess launcher catalog", () => {
    const orchestrator = createStandaloneAppIntegrationOrchestrator();

    expect(orchestrator.describeSession("transformer").playfield).toBe(
      getPlayfieldForSessionKind("transformer"),
    );
    expect(orchestrator.describeSession("appStackPsc").playfield).toBe("libraryDeployment");
    expect(orchestrator.describeSession("runner").playfield).toBe("libraryDeployment");
  });

  it("forwards context playfieldMode to appStackPsc bootstrap as libraryPlayfieldEnsureMode", async () => {
    const orchestrator = createStandaloneAppIntegrationOrchestrator();
    const session = orchestrator.createSession(
      "appStackPsc",
      { miroirConfig, playfieldMode: "requireExisting" },
      appStackSessionOptions,
    );

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        libraryPlayfieldEnsureMode: "requireExisting",
      }),
    );
  });

  it("session-specific libraryPlayfieldEnsureMode wins over context playfieldMode", async () => {
    const orchestrator = createStandaloneAppIntegrationOrchestrator();
    const session = orchestrator.createSession(
      "appStackPsc",
      { miroirConfig, playfieldMode: "requireExisting" },
      { ...appStackSessionOptions, libraryPlayfieldEnsureMode: "createIfAbsent" },
    );

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        libraryPlayfieldEnsureMode: "createIfAbsent",
      }),
    );
  });
});

describe("StandaloneAppIntegrationOrchestrator (Gap A A3)", () => {
  const hostDomainController = { uuid: "host-dc" } as any;
  const hostManager = { uuid: "host-psc" } as any;
  const hostDeploymentMap = { "host-app": "host-deploy" } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    runAppStackIntegrationBootstrapMock.mockResolvedValue({
      domainController: hostDomainController,
      applicationDeploymentMap: appStackSessionOptions.applicationDeploymentMap,
      testApplicationUuid: selfApplicationLibrary.uuid,
      persistenceStoreControllerManager: hostManager,
    });
  });

  it("forwards hostMode and hostExecutionEnvironment to appStackPsc bootstrap", async () => {
    const orchestrator = createStandaloneAppIntegrationOrchestrator();
    const session = orchestrator.createSession(
      "appStackPsc",
      {
        miroirConfig,
        hostMode: "embedded",
        hostExecutionEnvironment: {
          domainController: hostDomainController,
          persistenceStoreControllerManager: hostManager,
          applicationDeploymentMap: {},
          testApplicationUuid: selfApplicationLibrary.uuid,
        },
      },
      appStackSessionOptions,
    );

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hostMode: "embedded",
        hostExecutionEnvironment: expect.objectContaining({
          domainController: hostDomainController,
          persistenceStoreControllerManager: hostManager,
        }),
      }),
    );
  });

  it("forwards platformEnsureMode and skipBootstrapPhases to domainController bootstrap", async () => {
    const orchestrator = createStandaloneAppIntegrationOrchestrator();
    const session = orchestrator.createSession(
      "domainController",
      {
        miroirConfig,
        platformEnsureMode: "requireExisting",
        skipBootstrapPhases: ["deployLibrary"],
      },
      {
        ...appStackSessionOptions,
        miroirDeploymentStorageConfiguration: { model: {}, data: {}, admin: {} },
        profile: "miroirPlatform",
      },
    );

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        platformEnsureMode: "requireExisting",
        skipBootstrapPhases: ["deployLibrary"],
      }),
    );
  });

  it("hostApplicationDeploymentMap overrides session applicationDeploymentMap", async () => {
    const orchestrator = createStandaloneAppIntegrationOrchestrator();
    const session = orchestrator.createSession(
      "appStackPsc",
      { miroirConfig, hostApplicationDeploymentMap: hostDeploymentMap },
      appStackSessionOptions,
    );

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationDeploymentMap: hostDeploymentMap,
      }),
    );
  });
});
