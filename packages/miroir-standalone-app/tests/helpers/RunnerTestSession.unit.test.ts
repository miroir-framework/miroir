import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  MiroirConfigClient,
} from "miroir-core";
import { getBootstrapPhasesForSessionKind, MiroirActivityTracker, MiroirEventService } from "miroir-core";
import { libraryTestIdentifiers } from "miroir-test-app_deployment-library";
import {
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

const runAppStackIntegrationBootstrapMock = vi.fn();
const beforeEachTestMock = vi.fn();

vi.mock("./appStackIntegrationBootstrap.js", () => ({
  runAppStackIntegrationBootstrap: (...args: unknown[]) =>
    runAppStackIntegrationBootstrapMock(...args),
}));

vi.mock("../4_view/RunnerIntegTestTools.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../4_view/RunnerIntegTestTools.js")>();
  return {
    ...actual,
    beforeEachTest: (...args: unknown[]) => beforeEachTestMock(...args),
  };
});

import { RunnerTestSession } from "./RunnerTestSession.js";

function baseMiroirConfig(): MiroirConfigClient {
  return {
    miroirConfigType: "client",
    client: {
      emulateServer: true,
      rootApiUrl: "http://localhost",
      filesystemDeploymentRootDirectory: "/tmp/miroir-test",
      deploymentStorageConfig: {
        [libraryTestIdentifiers.testApplicationDeploymentUuid]: {
          admin: { emulatedServerType: "sql" },
          model: { emulatedServerType: "sql" },
          data: { emulatedServerType: "sql" },
        },
      },
    },
  } as MiroirConfigClient;
}

describe("RunnerTestSession (Gap E R)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const domainController = {
      handleCompositeAction: vi.fn(),
    } as unknown as DomainControllerInterface;
    runAppStackIntegrationBootstrapMock.mockResolvedValue({
      domainController,
      applicationDeploymentMap: {} as ApplicationDeploymentMap,
      testApplicationUuid: libraryTestIdentifiers.testApplicationUuid,
      persistenceStoreControllerManager: {},
    });
    beforeEachTestMock.mockResolvedValue(undefined);
  });

  it("initSession calls runAppStackIntegrationBootstrap with runner phases", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const session = new RunnerTestSession({
      miroirConfig: baseMiroirConfig(),
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
    });

    await session.initSession();

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phases: getBootstrapPhasesForSessionKind("runner"),
        deployMiroirStrategy: "compositeAction",
        openAdminAndMiroirStoresOnServer: false,
        miroirDeploymentUuid: selfApplicationDeploymentMiroir.uuid,
        miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
        testApplicationUuid: libraryTestIdentifiers.testApplicationUuid,
        customFetch: expect.any(Function),
      }),
    );
  });

  it("beforeEach delegates to beforeEachTest", async () => {
    const tracker = new MiroirActivityTracker();
    const eventService = new MiroirEventService(tracker);
    const session = new RunnerTestSession({
      miroirConfig: baseMiroirConfig(),
      miroirActivityTracker: tracker,
      miroirEventService: eventService,
    });

    await session.initSession();
    await session.beforeEach();

    expect(beforeEachTestMock).toHaveBeenCalledTimes(1);
  });
});
