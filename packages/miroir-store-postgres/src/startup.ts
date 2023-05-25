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
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      console.log('called registerStoreFactory function for',appName, section, 'filesystem');
      
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
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      console.log('called registerStoreFactory function for',appName, section, 'filesystem');
      return Promise.resolve(
        config.emulatedServerType == "sql"
          ? new SqlDbDataStore(appName, dataStoreApplicationType, config.connectionString, config.schema)
          : new ErrorDataStore()
      )
    }
  );
}
