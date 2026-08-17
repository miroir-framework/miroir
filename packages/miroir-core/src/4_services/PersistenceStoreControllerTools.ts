import { defaultMiroirMetaModel } from "../1_core/defaultMiroirMetaModel";
import type { MiroirConfigClient } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { ConfigurationService } from "../3_controllers/ConfigurationService";
import { packageName } from "../constants";
import { cleanLevel } from "../1_core/constants";
import { MiroirLoggerFactory } from "./MiroirLoggerFactory";
import { PersistenceStoreControllerManager } from "./PersistenceStoreControllerManager";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "PersistenceStoreControllerTools");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => { log = logger; });


// ################################################################################################
export async function startLocalPersistenceStoreControllers(
  localMiroirPersistenceStoreController: PersistenceStoreControllerInterface,
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
) {
  await localMiroirPersistenceStoreController?.open();
  await localAppPersistenceStoreController?.open();
  try {
    await localMiroirPersistenceStoreController?.bootFromPersistedState(
      defaultMiroirMetaModel.entities,
      // defaultMiroirMetaModel.entityVersions,
    );
  } catch (error) {
    log.debug(
      "createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT: could not load persisted state from localMiroirPersistenceStoreController, datastore could be empty (this is not a problem)",
    );
  }
  try {
    await localAppPersistenceStoreController?.bootFromPersistedState(
      defaultMiroirMetaModel.entities,
      // defaultMiroirMetaModel.entityVersions,
    );
  } catch (error) {
    log.debug(
      "createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT: could not load persisted state from localAppPersistenceStoreController, datastore could be empty (this is not a problem)",
    );
  }
}


// ##############################################################################################
export async function mountApplicationDeployment(
  miroirConfig: MiroirConfigClient,
  applicationDeploymentUuid: string,
) {
  try {
    if (!miroirConfig || !miroirConfig.client || !miroirConfig.client.emulateServer) {
      throw new Error("Invalid configuration: 'client.emulateServer' must be defined in extractMetaModelConfig.json");
    }

    // Create persistence store controller manager
    log.debug("4. Creating persistence store controller manager...");
    const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      miroirConfig.client.filesystemDeploymentRootDirectory,
    );

    // Get storage configurations
    const libraryDeploymentStorageConfiguration = miroirConfig.client.deploymentStorageConfig[
      applicationDeploymentUuid
    ];

    // We need a domain controller to execute the deployment creation
    // Since we're in emulated server mode, we need to create both client and server controllers
    log.debug("6. Mounting filesystem stores...");
    // Get the persistence store controller for the library deployment
    let storeController = persistenceStoreControllerManager.getPersistenceStoreController(
      applicationDeploymentUuid
    );

    if (!storeController) {
      // Need to add the deployment first
      await persistenceStoreControllerManager.addPersistenceStoreController(
        applicationDeploymentUuid,
        libraryDeploymentStorageConfiguration
      );
      
      storeController = persistenceStoreControllerManager.getPersistenceStoreController(
        applicationDeploymentUuid
      );
    }

    if (!storeController) {
      throw new Error("Failed to get persistence store controller after adding");
    }

    log.debug("   Store mounted successfully");

    return { storeController, persistenceStoreControllerManager };
  } catch (error) {
    log.error("\n" + "!".repeat(80));
    log.error("Error during application deployment mounting:");
    log.error("!".repeat(80));
    log.error(error);
    log.error("!".repeat(80));
    throw error; // Rethrow to be caught by the main function
  }
}
