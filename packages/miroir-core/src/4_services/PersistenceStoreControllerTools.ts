import { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { defaultMiroirMetaModel } from "../1_core/Model";


// ################################################################################################
export async function startLocalPersistenceStoreControllers(
  localMiroirPersistenceStoreController: PersistenceStoreControllerInterface,
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
) {
  await localMiroirPersistenceStoreController?.open();
  await localAppPersistenceStoreController?.open();
  try {
    await localMiroirPersistenceStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
  } catch (error) {
    console.log('miroirBeforeAll: could not load persisted state from localMiroirPersistenceStoreController, datastore could be empty (this is not a problem)');
  }
  try {
    await localAppPersistenceStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
  } catch (error) {
    console.log('miroirBeforeAll: could not load persisted state from localAppPersistenceStoreController, datastore could be empty (this is not a problem)');
  }
}
