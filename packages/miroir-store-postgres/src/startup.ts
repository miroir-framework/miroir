import {
  ApplicationSection,
  ConfigurationService,
  DataStoreApplicationType,
  IDataSectionStore,
  StoreConfiguration,
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
      section: ApplicationSection,
      config: StoreConfiguration,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      log.log('called registerStoreFactory function for', section, 'sql', config);
      
      if (config.emulatedServerType == "sql" && dataStore) {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        return Promise.resolve(
          config.emulatedServerType == "sql" && dataStore
            ? new SqlDbModelStore(sqlDbStoreName, config.connectionString, config.schema, dataStore)
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
      section: ApplicationSection,
      config: StoreConfiguration,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      log.log('called registerStoreFactory function for', section, 'sql', config);
      if (config.emulatedServerType == "sql") {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        return Promise.resolve(
          config.emulatedServerType == "sql"
            ? new SqlDbDataStore(sqlDbStoreName, config.connectionString, config.schema)
            : new ErrorDataStore()
        );
      } else {
        return Promise.resolve(new ErrorDataStore());
      }

    }
  );
}
