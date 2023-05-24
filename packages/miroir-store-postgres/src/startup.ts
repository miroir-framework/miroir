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
import { SqlDbModelStore } from "./SqlDbModelStore.js";
import { SqlDbDataStore } from "./SqlDbDataStore.js";

export function miroirStorePostgresStartup() {
  ConfigurationService.registerStoreFactory(
    "sql",
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
        config.emulatedServerType == "sql" && dataStore
          ? new SqlDbModelStore(appName, dataStoreApplicationType, config.connectionString, config.schema, dataStore)
          : new ErrorModelStore()
      )
    }
  );
  ConfigurationService.registerStoreFactory(
    "sql",
    "data",
    async (
      appName: string,
      dataStoreApplicationType: DataStoreApplicationType,
      section: ApplicationSection,
      config: EmulatedServerConfig,
      dataStore?: DataStoreInterface
    ): Promise<DataStoreInterface | ModelStoreInterface> =>
      Promise.resolve(
        config.emulatedServerType == "sql"
          ? new SqlDbDataStore(appName, dataStoreApplicationType, config.connectionString, config.schema)
          : new ErrorDataStore()
      )
  );
}
