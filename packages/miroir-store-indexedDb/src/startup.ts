import {
  ApplicationSection,
  ConfigurationService,
  DataStoreApplicationType,
  DataStoreInterface,
  EmulatedServerConfig,
  ErrorDataStore,
  ErrorModelStore,
  ModelStoreInterface,
} from "miroir-core";
import { IndexedDbModelStore } from "./4_services/IndexedDbModelStore.js";
import { IndexedDbDataStore } from "./4_services/IndexedDbDataStore.js";
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
      dataStore?: DataStoreInterface
    ): Promise<DataStoreInterface | ModelStoreInterface> => {
      console.log('called registerStoreFactory function for filesystem, model');
      
      return Promise.resolve(
        config.emulatedServerType == "indexedDb" && dataStore
          ? new IndexedDbModelStore(appName, dataStoreApplicationType, new IndexedDb(config.indexedDbName + '-model'), dataStore)
          : new ErrorModelStore()
      )
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
      dataStore?: DataStoreInterface
    ): Promise<DataStoreInterface | ModelStoreInterface> =>
      Promise.resolve(
        config.emulatedServerType == "indexedDb"
          ? new IndexedDbDataStore(appName, dataStoreApplicationType, new IndexedDb(config.indexedDbName + '-data'))
          : new ErrorDataStore()
      )
  );
}
