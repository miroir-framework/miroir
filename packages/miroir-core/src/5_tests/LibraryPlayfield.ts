import type {
  Deployment,
  MetaModel,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import type { DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import type { PersistenceStoreControllerManagerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
import type {
  ApplicationDeploymentMap,
  ApplicationEntitiesAndInstances,
} from "../1_core/Deployment";
import {
  createDeploymentCompositeAction,
  resetAndinitializeDeploymentCompositeAction,
} from "../1_core/Deployment";
import { defaultMiroirModelEnvironment } from "../1_core/Model";
import { resetAndInitApplicationDeployment } from "../3_controllers/DomainController";

export type LibraryPlayfieldEnsureMode =
  | "createIfAbsent"
  | "requireExisting"
  | "skip";

export type EnsureLibraryPlayfieldParams = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  adminDeployment: Deployment;
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration;
  libraryDeploymentUuid: Uuid;
  librarySelfApplicationUuid: Uuid;
  mode: LibraryPlayfieldEnsureMode;
  persistenceStoreControllerManager?: PersistenceStoreControllerManagerInterface;
};

export type ResetLibraryPlayfieldParams = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  libraryDeploymentUuid: Uuid;
  librarySelfApplicationUuid: Uuid;
  miroirDeploymentUuid?: Uuid;
  miroirSelfApplicationUuid?: Uuid;
  libraryEntitiesAndInstances?: ApplicationEntitiesAndInstances;
  librarySeedInitParams?: InitApplicationParameters;
  librarySeedMetaModel?: MetaModel;
  resetMiroirPlatform?: boolean;
  /** When set, used for resetAndInitApplicationDeployment instead of library/miroir defaults */
  deploymentsToReset?: Deployment[];
  postResetHook?: () => Promise<void>;
};

function libraryDeploymentExists(
  params: EnsureLibraryPlayfieldParams,
): boolean {
  if (!params.persistenceStoreControllerManager) {
    return false;
  }
  return !!params.persistenceStoreControllerManager.getPersistenceStoreController(
    params.libraryDeploymentUuid,
  );
}

function asDeployment(uuid: Uuid, selfApplication: Uuid): Deployment {
  return { uuid, selfApplication } as Deployment;
}

export async function ensureLibraryPlayfield(
  params: EnsureLibraryPlayfieldParams,
): Promise<{ created: boolean }> {
  const { mode, domainController, applicationDeploymentMap } = params;

  if (mode === "skip") {
    return { created: false };
  }

  const exists = libraryDeploymentExists(params);

  if (mode === "requireExisting") {
    if (!exists) {
      throw new Error(
        `ensureLibraryPlayfield: library deployment ${params.libraryDeploymentUuid} is required but absent (mode=requireExisting)`,
      );
    }
    return { created: false };
  }

  if (exists) {
    return { created: false };
  }

  const createLibraryDeploymentAction = createDeploymentCompositeAction(
    "library",
    params.libraryDeploymentUuid,
    params.librarySelfApplicationUuid,
    params.adminDeployment,
    params.libraryDeploymentStorageConfiguration,
  );
  const createLibraryResult = await domainController.handleCompositeAction(
    createLibraryDeploymentAction,
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  if (createLibraryResult.status !== "ok") {
    throw new Error(
      "ensureLibraryPlayfield: library deployment failed: " +
        JSON.stringify(createLibraryResult),
    );
  }

  return { created: true };
}

export async function resetLibraryPlayfield(
  params: ResetLibraryPlayfieldParams,
): Promise<void> {
  const {
    domainController,
    applicationDeploymentMap,
    libraryDeploymentUuid,
    librarySelfApplicationUuid,
    libraryEntitiesAndInstances,
    librarySeedInitParams,
    librarySeedMetaModel,
    resetMiroirPlatform,
    miroirDeploymentUuid,
    miroirSelfApplicationUuid,
    deploymentsToReset: explicitDeploymentsToReset,
    postResetHook,
  } = params;

  let deploymentsToReset: Deployment[] = [];

  if (explicitDeploymentsToReset?.length) {
    deploymentsToReset = explicitDeploymentsToReset;
  } else {
    if (resetMiroirPlatform) {
      if (!miroirDeploymentUuid || !miroirSelfApplicationUuid) {
        throw new Error(
          "resetLibraryPlayfield: miroirDeploymentUuid and miroirSelfApplicationUuid required when resetMiroirPlatform is true",
        );
      }
      deploymentsToReset.push(asDeployment(miroirDeploymentUuid, miroirSelfApplicationUuid));
    }

    if (libraryEntitiesAndInstances || !resetMiroirPlatform) {
      deploymentsToReset.push(
        asDeployment(libraryDeploymentUuid, librarySelfApplicationUuid),
      );
    }
  }

  if (deploymentsToReset.length > 0) {
    await resetAndInitApplicationDeployment(
      domainController,
      applicationDeploymentMap,
      deploymentsToReset,
    );
  }

  if (libraryEntitiesAndInstances) {
    if (!librarySeedInitParams || !librarySeedMetaModel) {
      throw new Error(
        "resetLibraryPlayfield: librarySeedInitParams and librarySeedMetaModel required when libraryEntitiesAndInstances is set",
      );
    }

    const initResult = await domainController.handleCompositeAction(
      resetAndinitializeDeploymentCompositeAction(
        librarySelfApplicationUuid,
        libraryDeploymentUuid,
        librarySeedInitParams,
        libraryEntitiesAndInstances,
        librarySeedMetaModel,
      ),
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {},
    );
    if (initResult.status !== "ok") {
      throw new Error(
        "resetLibraryPlayfield: library seed failed: " + JSON.stringify(initResult),
      );
    }
  }

  if (postResetHook) {
    await postResetHook();
  }
}
