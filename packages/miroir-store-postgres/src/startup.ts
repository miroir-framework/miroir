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
import { SqlDbModelStore } from "./SqlDbModelSectionStore.js";
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
      
      if (config.emulatedServerType == "sql" && dataStore) {
        return Promise.resolve(
          config.emulatedServerType == "sql" && dataStore
            ? new SqlDbModelStore(appName, dataStoreApplicationType, config.connectionString, config.schema, dataStore)
            : new ErrorModelStore()
        )
      } else {
        return Promise.resolve(new ErrorModelStore())
      }

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
      if (config.emulatedServerType == "sql") {
        return Promise.resolve(
          config.emulatedServerType == "sql"
            ? new SqlDbDataStore(appName, dataStoreApplicationType, config.connectionString, config.schema)
            : new ErrorDataStore()
        );
      } else {
        return Promise.resolve(new ErrorDataStore());
      }

    }
  );
}
