import {
  ApplicationSection,
  ConfigurationService,
  ErrorDataStore,
  ErrorModelStore,
  DataOrModelStoreInterface,
  StoreDataSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  StoreSectionConfiguration,
  getLoggerName,
  AdminStoreInterface,
  ErrorAdminStore
} from "miroir-core";
import { IndexedDbDataStoreSection } from "./4_services/IndexedDbDataStoreSection.js";
import { IndexedDbModelStoreSection } from "./4_services/IndexedDbModelStoreSection.js";
import { IndexedDb } from "./4_services/IndexedDbSnakeCase.js";
import { cleanLevel } from "./4_services/constants.js";
import { packageName } from "./constants.js";
import { IndexedDbAdminStore } from "./4_services/IndexedDbAdminStore.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"startup");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export function miroirIndexedDbStoreSectionStartup() {
  ConfigurationService.registerAdminStoreFactory(
    "indexedDb",
    async (config: StoreSectionConfiguration): Promise<AdminStoreInterface> => {
      if (config.emulatedServerType == "sql") {
        const sqlDbStoreName: string = config.connectionString + ":" + config.schema
        // return Promise.resolve(new SqlDbAdminStore(sqlDbStoreName, config.connectionString, config.schema))
        return Promise.resolve(new IndexedDbAdminStore(sqlDbStoreName, config.connectionString, config.schema))
      } else {
        return Promise.resolve(new ErrorAdminStore())
      }
    }
  )
  ConfigurationService.registerStoreSectionFactory(
    "indexedDb",
    "model",
    async (
      section: ApplicationSection, // TODO: remove?
      config: StoreSectionConfiguration,
      dataStore?: StoreDataSectionInterface
    ): Promise<DataOrModelStoreInterface> => {
      log.info('called registerStoreSectionFactory function for',section, config.emulatedServerType);
      
      if (config.emulatedServerType == "indexedDb" && dataStore) {
        const indexedDbStoreName = config.indexedDbName + '-model'
        const db = new IndexedDbModelStoreSection(indexedDbStoreName, new IndexedDb(indexedDbStoreName), dataStore)
        // db.open()
        return db;
      } else {
        return new ErrorModelStore()
      }
    }
  );
  ConfigurationService.registerStoreSectionFactory(
    "indexedDb",
    "data",
    async (
      section: ApplicationSection, // TODO: remove?
      config: StoreSectionConfiguration,
      dataStore?: StoreDataSectionInterface
    ): Promise<DataOrModelStoreInterface> => {
      if (config.emulatedServerType == "indexedDb") {
        log.info('called registerStoreSectionFactory function for', config.emulatedServerType, config.indexedDbName);
        const indexedDbStoreName = config.indexedDbName + '-data'
        const db = new IndexedDbDataStoreSection(indexedDbStoreName, new IndexedDb(indexedDbStoreName))
        return db;
      } else {
        log.warn('called registerStoreSectionFactory data for', config);
        return new ErrorDataStore()
      }
    }
  );
}
