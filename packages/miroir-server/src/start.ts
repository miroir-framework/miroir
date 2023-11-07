// ###################################################################################

import { ConfigurationService, StoreControllerFactory, defaultMiroirMetaModel, miroirCoreStartup } from "miroir-core";
import { miroirStoreFileSystemStartup } from "miroir-store-filesystem";
import { miroirStoreIndexedDbStartup } from "miroir-store-indexedDb";
import { miroirStorePostgresStartup } from "miroir-store-postgres";

import {
  IStoreController,
  MiroirConfig
} from "miroir-core";


// TODO: factorize similar function in standalone-app index.tsx?
export async function startServer(
  miroirConfig:MiroirConfig
) {
  // Start our mock API server
  // const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);

  miroirCoreStartup();
  miroirStoreFileSystemStartup();
  miroirStoreIndexedDbStartup();
  miroirStorePostgresStartup();
    
  let
    localMiroirStoreController:IStoreController,
    localAppStoreController:IStoreController
  ;

  const {
    localMiroirStoreController:a,localAppStoreController:b
  } = await StoreControllerFactory(
    ConfigurationService.storeFactoryRegister,
    miroirConfig,
  );
  localMiroirStoreController = a;
  localAppStoreController = b;
  
  try {
    await localMiroirStoreController?.open();
    await localMiroirStoreController.bootFromPersistedState(defaultMiroirMetaModel.entities, defaultMiroirMetaModel.entityDefinitions);
  } catch(e) {
    console.error("failed to initialize meta-model, Entity 'Entity' is likely missing from Database, or database could not be opened. Entity Entity can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",localMiroirStoreController.getEntityUuids(),'error',e);
  }
  
  try {
    await localAppStoreController?.open();
    await localAppStoreController.bootFromPersistedState(defaultMiroirMetaModel.entities, defaultMiroirMetaModel.entityDefinitions);
  } catch(e) {
    console.error("failed to initialize app, Entity 'Entity' is likely missing from Database, or database could not be opened. Entity Entity can be (re-)created using the 'InitDb' functionality on the client. this.sqlEntities:",localMiroirStoreController.getEntityUuids(),'error',e);
  }
  return Promise.resolve({localMiroirStoreController, localAppStoreController})
}
