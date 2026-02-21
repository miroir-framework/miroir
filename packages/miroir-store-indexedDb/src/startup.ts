import {
  ApplicationSection,
  ErrorAdminStore,
  ErrorDataStore,
  ErrorModelStore,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreDataOrModelSectionInterface,
  PersistenceStoreDataSectionInterface,
  StoreSectionConfiguration,
  type ConfigurationServiceInner
} from "miroir-core";
import { IndexedDb } from "./4_services/IndexedDb.js";
import { IndexedDbAdminStore } from "./4_services/IndexedDbAdminStore.js";
import { IndexedDbDataStoreSection } from "./4_services/IndexedDbDataStoreSection.js";
import { IndexedDbModelStoreSection } from "./4_services/IndexedDbModelStoreSection.js";
import { cleanLevel } from "./4_services/constants.js";
import { packageName } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "startup")
).then((logger: LoggerInterface) => {log = logger});


export function miroirIndexedDbStoreSectionStartup(
  configurationService: ConfigurationServiceInner
) {
  configurationService.registerAdminStoreFactory(
    "indexedDb",
    async (config: StoreSectionConfiguration): Promise<PersistenceStoreAdminSectionInterface> => {
      if (config.emulatedServerType == "indexedDb") {
        const indexedDbStoreName: string = config.indexedDbName + '-model'
        return Promise.resolve(new IndexedDbAdminStore(indexedDbStoreName, new IndexedDb("data",indexedDbStoreName))) // TODO: add "admin" ApplicationSection?
      } else {
        return Promise.resolve(new ErrorAdminStore())
      }
    }
  )
  configurationService.registerStoreSectionFactory(
    "indexedDb",
    "model",
    async (
      section: ApplicationSection, // TODO: remove?
      config: StoreSectionConfiguration,
      dataStore?: PersistenceStoreDataSectionInterface
    ): Promise<PersistenceStoreDataOrModelSectionInterface> => {
      log.info('called registerStoreSectionFactory model function for',section, config.emulatedServerType);
      
      if (config.emulatedServerType == "indexedDb" && dataStore) {
        const indexedDbStoreName = config.indexedDbName + '-model'
        const db = new IndexedDbModelStoreSection(indexedDbStoreName, new IndexedDb("model", indexedDbStoreName), dataStore)
        return Promise.resolve(db);
      } else {
        log.warn('called registerStoreSectionFactory model for', section, config, "returns ErrorDataStore!");
        return Promise.resolve(new ErrorModelStore())
      }
    }
  );
  configurationService.registerStoreSectionFactory(
    "indexedDb",
    "data",
    async (
      section: ApplicationSection, // TODO: remove?
      config: StoreSectionConfiguration,
      dataStore?: PersistenceStoreDataSectionInterface
    ): Promise<PersistenceStoreDataOrModelSectionInterface> => {
      if (config.emulatedServerType == "indexedDb") {
        log.info('called registerStoreSectionFactory data function for', section, config);
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
