import { IStoreController } from "../0_interfaces/4-services/StoreControllerInterface";
import { defaultMiroirMetaModel } from "../1_core/Model";


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
// export async function createStoreControllers(
//   storeControllerManager: StoreControllerManagerInterface,
//   miroirConfig: MiroirConfig,
// ) {

//   if (!miroirConfig.emulateServer) {
//     console.warn('miroirBeforeAll: emulateServer is true in miroirConfig, a real server is used, tests results depend on the availability of the server.');
//   } else {
//     await storeControllerManager.addStoreController(
//       "miroir",
//       "miroir",
//       applicationDeploymentMiroir.uuid,
//       miroirConfig.miroirServerConfig
//     );
//     await storeControllerManager.addStoreController(
//       "library",
//       "app",
//       applicationDeploymentLibrary.uuid,
//       miroirConfig.appServerConfig
//     );
//   }
// }
