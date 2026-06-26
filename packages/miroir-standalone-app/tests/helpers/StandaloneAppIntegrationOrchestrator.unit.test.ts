import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DomainControllerInterface, MiroirConfigClient } from "miroir-core";
import { getPlayfieldForSessionKind } from "miroir-core";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

const runAppStackIntegrationBootstrapMock = vi.fn();

vi.mock("./appStackIntegrationBootstrap.js", () => ({
  runAppStackIntegrationBootstrap: (...args: unknown[]) =>
    runAppStackIntegrationBootstrapMock(...args),
}));

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
