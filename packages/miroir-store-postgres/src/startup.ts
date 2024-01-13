import {
  ApplicationSection,
  ConfigurationService,
  ErrorDataStore,
  ErrorModelStore,
  StoreDataSectionInterface,
  StoreModelSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  StoreSectionConfiguration,
  getLoggerName,
  AdminStoreInterface,
  ErrorAdminStore
} from "miroir-core";
import { SqlDbDataStoreSection } from "./4_services/SqlDbDataStoreSection.js";
import { SqlDbModelStoreSection } from "./4_services/SqlDbModelStoreSection.js";

import { cleanLevel } from "./4_services/constants.js";
import { packageName } from "./constants.js";
import { SqlDbAdminStore } from "./4_services/SqlDbAdminStore.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"startup");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export function miroirPostgresStoreSectionStartup() {
  log.info("miroirPostgresStoreSectionStartup called!")
  ConfigurationService.registerAdminStoreFactory(
    "sql",
    async (config: StoreSectionConfiguration): Promise<AdminStoreInterface> => {
      if (config.emulatedServerType == "sql") {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        // return Promise.resolve(new SqlDbAdminStore(sqlDbStoreName, config.connectionString, config.schema))
        return Promise.resolve(new SqlDbAdminStore(sqlDbStoreName, config.connectionString, config.schema))
      } else {
        return Promise.resolve(new ErrorAdminStore())
      }
    }
  )
  ConfigurationService.registerStoreSectionFactory(
    "sql",
    "model",
    async (
      section: ApplicationSection,
      config: StoreSectionConfiguration,
      dataStore?: StoreDataSectionInterface
    ): Promise<StoreDataSectionInterface | StoreModelSectionInterface> => {
      log.info('called registerStoreSectionFactory function for', section, 'sql', config);
      
      if (config.emulatedServerType == "sql" && dataStore) {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        return Promise.resolve(
          config.emulatedServerType == "sql" && dataStore
            ? new SqlDbModelStoreSection(sqlDbStoreName, config.connectionString, config.schema, dataStore)
            : new ErrorModelStore()
        )
      } else {
        return Promise.resolve(new ErrorModelStore())
      }

    }
  );
  ConfigurationService.registerStoreSectionFactory(
    "sql",
    "data",
    async (
      section: ApplicationSection,
      config: StoreSectionConfiguration,
      dataStore?: StoreDataSectionInterface
    ): Promise<StoreDataSectionInterface | StoreModelSectionInterface> => {
      log.info('called registerStoreSectionFactory function for', section, 'sql', config);
      if (config.emulatedServerType == "sql") {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        return Promise.resolve(
          config.emulatedServerType == "sql"
            ? new SqlDbDataStoreSection(sqlDbStoreName, config.connectionString, config.schema)
            : new ErrorDataStore()
        );
      } else {
        return Promise.resolve(new ErrorDataStore());
      }

    }
  );
}
