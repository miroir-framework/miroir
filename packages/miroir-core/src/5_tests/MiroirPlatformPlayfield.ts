import type {
  Deployment,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import type { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { createDeploymentCompositeAction } from "../1_core/Deployment";
import { defaultMiroirModelEnvironment } from "../1_core/Model";

export type MiroirPlatformEnsureMode =
  | "createIfAbsent"
  | "requireExisting"
  | "skip";

export type DeployMiroirStrategy = "pscHelper" | "compositeAction";

export type EnsureMiroirPlatformParams = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  adminDeployment: Deployment;
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  miroirDeploymentUuid: Uuid;
  miroirSelfApplicationUuid: Uuid;
  mode: MiroirPlatformEnsureMode;
  deployStrategy: DeployMiroirStrategy;
  persistenceStoreControllerManager?: PersistenceStoreControllerManagerInterface;
  /** Required when `deployStrategy` is `pscHelper` and deployment must be created. */
  deployViaPscHelper?: () => Promise<void>;
};

function miroirPlatformExists(params: EnsureMiroirPlatformParams): boolean {
  if (!params.persistenceStoreControllerManager) {
    return false;
  }
  return !!params.persistenceStoreControllerManager.getPersistenceStoreController(
    params.miroirDeploymentUuid,
  );
}

async function deployMiroirPlatform(params: EnsureMiroirPlatformParams): Promise<void> {
  if (params.deployStrategy === "compositeAction") {
    const createMiroirDeploymentAction = createDeploymentCompositeAction(
      "miroir",
      params.miroirDeploymentUuid,
      params.miroirSelfApplicationUuid,
      params.adminDeployment,
      params.miroirDeploymentStorageConfiguration,
    );
    const createDeploymentResult = await params.domainController.handleCompositeAction(
      createMiroirDeploymentAction,
      params.applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {},
    );
    if (createDeploymentResult.status !== "ok") {
      throw new Error(
        "ensureMiroirPlatform: miroir deployment failed: " +
          JSON.stringify(createDeploymentResult),
      );
    }
    return;
  }

  if (!params.deployViaPscHelper) {
    throw new Error(
      "ensureMiroirPlatform: deployViaPscHelper is required when deployStrategy is pscHelper",
    );
  }
  await params.deployViaPscHelper();
}

export async function ensureMiroirPlatform(
  params: EnsureMiroirPlatformParams,
): Promise<{ created: boolean }> {
  const { mode } = params;

  if (mode === "skip") {
    return { created: false };
  }

  const exists = miroirPlatformExists(params);

  if (mode === "requireExisting") {
    if (!exists) {
      throw new Error(
        `ensureMiroirPlatform: miroir deployment ${params.miroirDeploymentUuid} is required but absent (mode=requireExisting)`,
      );
    }
    return { created: false };
  }

  if (exists) {
    return { created: false };
  }

  await deployMiroirPlatform(params);
  return { created: true };
}
