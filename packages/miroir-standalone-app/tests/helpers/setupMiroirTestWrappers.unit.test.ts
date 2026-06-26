import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApplicationDeploymentMap, DomainControllerInterface, MiroirConfigClient } from "miroir-core";
import { getBootstrapPhasesForSessionKind } from "miroir-core";

const runAppStackIntegrationBootstrapMock = vi.fn();

vi.mock("./appStackIntegrationBootstrap.js", () => ({
  runAppStackIntegrationBootstrap: (...args: unknown[]) =>
    runAppStackIntegrationBootstrapMock(...args),
}));

import {
  setupMiroirTestAndCreateMiroirDeployment,
  setupMiroirTestAndDeployMiroirApp,
} from "../../src/miroir-fwk/4-tests/setupMiroirTest.js";
import { MiroirActivityTracker, MiroirEventService } from "miroir-core";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import {
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

describe("setupMiroirTest wrappers (Gap E B2)", () => {
  const miroirConfig = { client: { emulateServer: true } } as MiroirConfigClient;
  const applicationDeploymentMap = {} as ApplicationDeploymentMap;
  const adminDeployment = { uuid: "admin" } as any;
  const miroirDeploymentStorageConfiguration = {} as any;
  const tracker = new MiroirActivityTracker();
  const eventService = new MiroirEventService(tracker);

  beforeEach(() => {
    vi.clearAllMocks();
    runAppStackIntegrationBootstrapMock.mockResolvedValue({
      domainController: {} as DomainControllerInterface,
      persistenceStoreControllerManager: {},
    });
  });

  it("setupMiroirTestAndCreateMiroirDeployment requests wire + deployMiroir compositeAction path", async () => {
    await setupMiroirTestAndCreateMiroirDeployment(
      miroirConfig,
      tracker,
      eventService,
      "miroir-deploy-uuid",
      "miroir-app-uuid",
      adminDeployment,
      miroirDeploymentStorageConfiguration,
      applicationDeploymentMap,
    );

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phases: ["wireEmulatedStack", "deployMiroir"],
        deployMiroirStrategy: "compositeAction",
        openAdminAndMiroirStoresOnServer: true,
        miroirDeploymentUuid: "miroir-deploy-uuid",
        miroirSelfApplicationUuid: "miroir-app-uuid",
        testApplicationUuid: selfApplicationLibrary.uuid,
        customFetch: expect.any(Function),
      }),
    );
  });

  it("setupMiroirTestAndDeployMiroirApp requests runner bootstrap phases", async () => {
    await setupMiroirTestAndDeployMiroirApp(
      miroirConfig,
      tracker,
      eventService,
      adminDeployment,
      miroirDeploymentStorageConfiguration,
      applicationDeploymentMap,
    );

    expect(runAppStackIntegrationBootstrapMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phases: getBootstrapPhasesForSessionKind("runner"),
        deployMiroirStrategy: "compositeAction",
        openAdminAndMiroirStoresOnServer: false,
        miroirDeploymentUuid: selfApplicationDeploymentMiroir.uuid,
        miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
        testApplicationUuid: selfApplicationLibrary.uuid,
        customFetch: expect.any(Function),
      }),
    );
  });
});
