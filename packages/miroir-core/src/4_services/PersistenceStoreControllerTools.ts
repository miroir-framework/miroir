import type { MiroirConfigClient } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { defaultMiroirMetaModel } from "../1_core/Model";
import { ConfigurationService } from "../3_controllers/ConfigurationService";
import { PersistenceStoreControllerManager } from "./PersistenceStoreControllerManager";


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
      defaultMiroirMetaModel.entityDefinitions,
    );
  } catch (error) {
    console.log(
      "createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT: could not load persisted state from localMiroirPersistenceStoreController, datastore could be empty (this is not a problem)",
    );
  }
  try {
    await localAppPersistenceStoreController?.bootFromPersistedState(
      defaultMiroirMetaModel.entities,
      defaultMiroirMetaModel.entityDefinitions,
    );
  } catch (error) {
    console.log(
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
    console.log("4. Creating persistence store controller manager...");
    const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister
    );

    // Get storage configurations
    const libraryDeploymentStorageConfiguration = miroirConfig.client.deploymentStorageConfig[
      applicationDeploymentUuid
    ];

    // We need a domain controller to execute the deployment creation
    // Since we're in emulated server mode, we need to create both client and server controllers
    console.log("6. Mounting filesystem stores...");
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

    console.log("   Store mounted successfully");

    return { storeController, persistenceStoreControllerManager };
  } catch (error) {
    console.error("\n" + "!".repeat(80));
    console.error("Error during application deployment mounting:");
    console.error("!".repeat(80));
    console.error(error);
    console.error("!".repeat(80));
    throw error; // Rethrow to be caught by the main function
  }
}
