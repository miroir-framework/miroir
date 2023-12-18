import { MiroirConfig } from "../0_interfaces/1_core/MiroirConfig";
import { IStoreController } from "../0_interfaces/4-services/StoreControllerInterface";
import { StoreControllerManagerInterface } from "../0_interfaces/4-services/StoreControllerManagerInterface";
import { defaultMiroirMetaModel } from "../1_core/Model";

import applicationDeploymentMiroir from "../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json";
import { applicationDeploymentLibrary } from "../ApplicationDeploymentLibrary";

// ################################################################################################
export async function startLocalStoreControllers(
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
) {
  await localMiroirStoreController?.open();
  await localAppStoreController?.open();
  try {
    await localMiroirStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
  } catch (error) {
    console.log('miroirBeforeAll: could not load persisted state from localMiroirStoreController, datastore could be empty (this is not a problem)');
  }
  try {
    await localAppStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
  } catch (error) {
    console.log('miroirBeforeAll: could not load persisted state from localAppStoreController, datastore could be empty (this is not a problem)');
  }
}

// ################################################################################################
export async function createStoreControllers(
  storeControllerManager: StoreControllerManagerInterface,
  miroirConfig: MiroirConfig,
) {

  if (!miroirConfig.emulateServer) {
    console.warn('miroirBeforeAll: emulateServer is true in miroirConfig, a real server is used, tests results depend on the availability of the server.');
  } else {
    await storeControllerManager.addStoreController(
      "miroir",
      "miroir",
      applicationDeploymentMiroir.uuid,
      miroirConfig.miroirServerConfig
    );
    await storeControllerManager.addStoreController(
      "library",
      "app",
      applicationDeploymentLibrary.uuid,
      miroirConfig.appServerConfig
    );
  }
}
