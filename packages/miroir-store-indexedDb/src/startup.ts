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
import { IndexedDb } from "./4_services/IndexedDb.js";
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
      if (config.emulatedServerType == "indexedDb") {
        const indexedDbStoreName: string = config.indexedDbName + '-model'
        // return Promise.resolve(new SqlDbAdminStore(sqlDbStoreName, config.connectionString, config.schema))
        return Promise.resolve(new IndexedDbAdminStore(indexedDbStoreName, new IndexedDb("data",indexedDbStoreName))) // TODO: add "admin" ApplicationSection?
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
      log.info('called registerStoreSectionFactory function for',section, config.emulatedServerType, dataStore);
      
      if (config.emulatedServerType == "indexedDb" && dataStore) {
        const indexedDbStoreName = config.indexedDbName + '-model'
        const db = new IndexedDbModelStoreSection(indexedDbStoreName, new IndexedDb("model", indexedDbStoreName), dataStore)
        // db.open()
        return Promise.resolve(db);
      } else {
        log.warn('called registerStoreSectionFactory data for', section, config, dataStore, "returns ErrorDataStore!");
        return Promise.resolve(new ErrorModelStore())
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
        log.info('called registerStoreSectionFactory function for', section, config);
        const indexedDbStoreName = config.indexedDbName + '-data'
        const db = new IndexedDbDataStoreSection(indexedDbStoreName, new IndexedDb("data", indexedDbStoreName))
        return Promise.resolve(db);
      } else {
        log.warn('called registerStoreSectionFactory data for', section, config, "returns ErrorDataStore!");
        return Promise.resolve(new ErrorDataStore())
      }
    }
  );
}
