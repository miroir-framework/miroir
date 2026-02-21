import {
  ApplicationSection,
  ErrorAdminStore,
  ErrorDataStore,
  ErrorModelStore,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
  StoreSectionConfiguration,
  type ConfigurationServiceInner
} from "miroir-core";
import { SqlDbDataStoreSection } from "./4_services/SqlDbDataStoreSection.js";
import { SqlDbModelStoreSection } from "./4_services/SqlDbModelStoreSection.js";

import { cleanLevel } from "./4_services/constants.js";
import { SqlDbAdminStore } from "./4_services/SqlDbAdminStore.js";
import { packageName } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "startup")
).then((logger: LoggerInterface) => {log = logger});


export function miroirPostgresStoreSectionStartup(configurationService: ConfigurationServiceInner) {
  log.info("miroirPostgresStoreSectionStartup called!")
  configurationService.registerAdminStoreFactory(
    "sql",
    async (config: StoreSectionConfiguration): Promise<PersistenceStoreAdminSectionInterface> => {
      if (config.emulatedServerType == "sql") {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        const logHeader = "SqlDbAdminStore " + sqlDbStoreName;
        // return Promise.resolve(new SqlDbAdminStore(sqlDbStoreName, config.connectionString, config.schema))
        return Promise.resolve(new SqlDbAdminStore("admin", sqlDbStoreName, config.connectionString, config.schema, logHeader))
      } else {
        return Promise.resolve(new ErrorAdminStore())
      }
    }
  )
  configurationService.registerStoreSectionFactory(
    "sql",
    "model",
    async (
      section: ApplicationSection,
      config: StoreSectionConfiguration,
      dataStore?: PersistenceStoreDataSectionInterface
    ): Promise<PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface> => {
      log.info('called registerStoreSectionFactory function for', section, 'sql', config);
      
      if (config.emulatedServerType == "sql" && dataStore) {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        return Promise.resolve(
          config.emulatedServerType == "sql" && dataStore
            ? new SqlDbModelStoreSection("model", sqlDbStoreName, config.connectionString, config.schema, dataStore)
            : new ErrorModelStore()
        )
      } else {
        return Promise.resolve(new ErrorModelStore())
      }

    }
  );
  configurationService.registerStoreSectionFactory(
    "sql",
    "data",
    async (
      section: ApplicationSection,
      config: StoreSectionConfiguration,
      dataStore?: PersistenceStoreDataSectionInterface
    ): Promise<PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface> => {
      log.info('called registerStoreSectionFactory function for', section, 'sql', config);
      if (config.emulatedServerType == "sql") {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        return Promise.resolve(
          config.emulatedServerType == "sql"
            ? new SqlDbDataStoreSection("data", sqlDbStoreName, config.connectionString, config.schema)
            : new ErrorDataStore()
        );
      } else {
        return Promise.resolve(new ErrorDataStore());
      }

    }
  );
}
