import {
  ApplicationSection,
  ConfigurationService,
  DataStoreApplicationType,
  IDataSectionStore,
  EmulatedServerConfig,
  ErrorDataStore,
  ErrorModelStore,
  IModelSectionStore,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
} from "miroir-core";
import { SqlDbModelStore } from "./4_services/SqlDbModelSectionStore.js";
import { SqlDbDataStore } from "./4_services/SqlDbDataStore.js";

import { packageName } from "./constants.js";
import { cleanLevel } from "./4_services/constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"startup");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
      log.log('called registerStoreFactory function for',appName, section, 'filesystem');
      
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
      log.log('called registerStoreFactory function for',appName, section, 'filesystem');
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
