import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DomainControllerInterface, MiroirConfigClient } from "miroir-core";
import {
  getBootstrapPhasesForDomainControllerProfile,
  getPlayfieldForDomainControllerProfile,
} from "miroir-core";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import {
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

const runAppStackIntegrationBootstrapMock = vi.fn();

vi.mock("./appStackIntegrationBootstrap.js", () => ({
  runAppStackIntegrationBootstrap: (...args: unknown[]) =>
    runAppStackIntegrationBootstrapMock(...args),
}));

import { DomainControllerIntegrationTestSession } from "./DomainControllerIntegrationTestSession.js";

const miroirConfig = {
  client: { emulateServer: true },
} as MiroirConfigClient;

const sessionOptions = {
  applicationDeploymentMap: {},
  adminDeployment: { uuid: "admin-uuid" },
  miroirDeploymentStorageConfiguration: { model: {}, data: {}, admin: {} },
  libraryDeploymentStorageConfiguration: { model: {}, data: {}, admin: {} },
} as any;

describe("DomainControllerIntegrationTestSession (Gap E DC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runAppStackIntegrationBootstrapMock.mockResolvedValue({
      domainController: {} as DomainControllerInterface,
      applicationDeploymentMap: sessionOptions.applicationDeploymentMap,
      testApplicationUuid: selfApplicationLibrary.uuid,
      persistenceStoreControllerManager: {},
    });
  });

  it("miroirPlatform descriptor playfield is none", () => {
    const session = new DomainControllerIntegrationTestSession(
      miroirConfig,
      sessionOptions,
      "miroirPlatform",
    );

    expect(session.descriptor.playfield).toBe(
      getPlayfieldForDomainControllerProfile("miroirPlatform"),
    );
    expect(session.descriptor.playfield).toBe("none");
  });

  it("miroirPlatform requests bootstrap phases including resetMiroirModel", async () => {
    const session = new DomainControllerIntegrationTestSession(
      miroirConfig,
      sessionOptions,
      "miroirPlatform",
    );

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phases: getBootstrapPhasesForDomainControllerProfile("miroirPlatform"),
        deployMiroirStrategy: "compositeAction",
        openAdminAndMiroirStoresOnServer: true,
        miroirDeploymentUuid: selfApplicationDeploymentMiroir.uuid,
        miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
        testApplicationUuid: selfApplicationLibrary.uuid,
      }),
    );
  });

  it("miroirPlatform can skip resetMiroirModel for Model.CRUD-style hooks", async () => {
    const session = new DomainControllerIntegrationTestSession(
      miroirConfig,
      { ...sessionOptions, skipResetMiroirModelInInit: true },
      "miroirPlatform",
    );

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phases: ["wireEmulatedStack", "deployMiroir"],
      }),
    );
  });

  it("miroirAndLibrary descriptor playfield is libraryDeployment", () => {
    const session = new DomainControllerIntegrationTestSession(
      miroirConfig,
      sessionOptions,
      "miroirAndLibrary",
    );

    expect(session.descriptor.playfield).toBe("libraryDeployment");
  });

  it("miroirAndLibrary deploys library without resetMiroirModel", async () => {
    const session = new DomainControllerIntegrationTestSession(
      miroirConfig,
      sessionOptions,
      "miroirAndLibrary",
    );

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phases: getBootstrapPhasesForDomainControllerProfile("miroirAndLibrary"),
      }),
    );
    const phases =
      runAppStackIntegrationBootstrapMock.mock.calls[0][0].phases as string[];
    expect(phases).not.toContain("resetMiroirModel");
    expect(phases).toContain("deployLibrary");
  });

  it("miroirAndLibrary forwards libraryPlayfieldEnsureMode to bootstrap", async () => {
    const session = new DomainControllerIntegrationTestSession(
      miroirConfig,
      { ...sessionOptions, libraryPlayfieldEnsureMode: "requireExisting" },
      "miroirAndLibrary",
    );

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        libraryPlayfieldEnsureMode: "requireExisting",
      }),
    );
  });
});
