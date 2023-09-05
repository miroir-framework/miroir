import {
  ApplicationSection,
  ConfigurationService,
  DataStoreApplicationType,
  IDataSectionStore,
  EmulatedServerConfig,
  ErrorDataStore,
  ErrorModelStore,
  IModelSectionStore,
} from "miroir-core";
import { IndexedDbModelSectionStore } from "./4_services/IndexedDbModelSectionStore.js";
import { IndexedDbDataSectionStore } from "./4_services/IndexedDbDataSectionStore.js";
import { IndexedDb } from "./4_services/indexedDb.js";

export function miroirStoreIndexedDbStartup() {
  ConfigurationService.registerStoreFactory(
    "indexedDb",
    "model",
    async (
      appName: string,
      dataStoreApplicationType: DataStoreApplicationType,
      section: ApplicationSection,
      config: EmulatedServerConfig,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      console.log('called registerStoreFactory function for',appName, section, config.emulatedServerType);
      
      if (config.emulatedServerType == "indexedDb" && dataStore) {
        const db = new IndexedDbModelSectionStore(appName, dataStoreApplicationType, new IndexedDb(config.indexedDbName + '-model'), dataStore)
        // db.open()
        return db;
      } else {
        return new ErrorModelStore()
      }
    }
  );
  ConfigurationService.registerStoreFactory(
    "indexedDb",
    "data",
    async (
      appName: string,
      dataStoreApplicationType: DataStoreApplicationType,
      section: ApplicationSection,
      config: EmulatedServerConfig,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      console.log('called registerStoreFactory function for',appName, section, config.emulatedServerType);
      if (config.emulatedServerType == "indexedDb") {
        const db = new IndexedDbDataSectionStore(appName, dataStoreApplicationType, new IndexedDb(config.indexedDbName + '-data'))
        // db.open()
        return db;
      } else {
        return new ErrorDataStore()
      }
    }
  );
}
