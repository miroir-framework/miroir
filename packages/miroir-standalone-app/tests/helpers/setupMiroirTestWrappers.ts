import crossFetch from "cross-fetch";

import {
  getBootstrapPhasesForSessionKind,
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type LoggerInterface,
  type MiroirConfigClient,
  type PersistenceStoreControllerManager,
  type StoreUnitConfiguration,
} from "miroir-core";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

import { runAppStackIntegrationBootstrap } from "./appStackIntegrationBootstrap.js";
import { packageName } from "../../src/constants.js";
import { cleanLevel } from "../../src/miroir-fwk/4_view/constants.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "setupMiroirTestWrappers");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

/**
 * @deprecated Prefer `DomainControllerIntegrationTestSession` (Gap E).
 * @see packages/miroir-standalone-app/tests/helpers/DomainControllerIntegrationTestSession.ts
 */
export async function setupMiroirTestAndCreateMiroirDeployment(
  miroirConfig: MiroirConfigClient,
  miroirActivityTracker: MiroirActivityTracker,
  miroirEventService: MiroirEventService,
  miroirDeploymentUuid: string,
  miroirSelfApplicationUuid: string,
  adminDeployment: Deployment,
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration,
  applicationDeploymentMap: ApplicationDeploymentMap,
  customFetch?: any,
): Promise<{
  domainController: DomainControllerInterface;
}> {
  const { domainController } = await runAppStackIntegrationBootstrap({
    miroirConfig,
    applicationDeploymentMap,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
    miroirDeploymentUuid,
    miroirSelfApplicationUuid,
    phases: ["wireEmulatedStack", "deployMiroir"],
    miroirActivityTracker,
    miroirEventService,
    customFetch: customFetch ?? crossFetch,
    testApplicationUuid: selfApplicationLibrary.uuid,
    deployMiroirStrategy: "compositeAction",
    openAdminAndMiroirStoresOnServer: true,
  });
  return { domainController };
}

/**
 * @deprecated Prefer `RunnerTestSession` (Gap E).
 * @see packages/miroir-standalone-app/src/miroir-fwk/4-tests/RunnerTestSession.ts
 */
export async function setupMiroirTestAndDeployMiroirApp(
  miroirConfig: MiroirConfigClient,
  miroirActivityTracker: MiroirActivityTracker,
  miroirEventService: MiroirEventService,
  adminDeployment: Deployment,
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<{
  domainController: DomainControllerInterface;
  persistenceStoreControllerManager: PersistenceStoreControllerManager;
}> {
  log.debug("beforeAll bootstrap starting");
  const executionEnvironment = await runAppStackIntegrationBootstrap({
    miroirConfig,
    applicationDeploymentMap,
    adminDeployment,
    miroirDeploymentStorageConfiguration,
    miroirDeploymentUuid: deployment_Miroir.uuid,
    miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
    phases: getBootstrapPhasesForSessionKind("runner"),
    miroirActivityTracker,
    miroirEventService,
    customFetch: crossFetch,
    testApplicationUuid: selfApplicationLibrary.uuid,
    deployMiroirStrategy: "compositeAction",
    openAdminAndMiroirStoresOnServer: false,
  });
  log.debug("beforeAll bootstrap done");

  return {
    domainController: executionEnvironment.domainController,
    persistenceStoreControllerManager:
      executionEnvironment.persistenceStoreControllerManager as PersistenceStoreControllerManager,
  };
}
