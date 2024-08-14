import {
  ApplicationSection,
  ConfigurationService,
  ErrorDataStore,
  ErrorModelStore,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  StoreSectionConfiguration,
  getLoggerName,
  PersistenceStoreAdminSectionInterface,
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
    async (config: StoreSectionConfiguration): Promise<PersistenceStoreAdminSectionInterface> => {
      if (config.emulatedServerType == "sql") {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        // return Promise.resolve(new SqlDbAdminStore(sqlDbStoreName, config.connectionString, config.schema))
        return Promise.resolve(new SqlDbAdminStore("data", sqlDbStoreName, config.connectionString, config.schema)) // TODO: fix application section, should be admin?
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
  ConfigurationService.registerStoreSectionFactory(
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
