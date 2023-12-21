import {
  ApplicationSection,
  ConfigurationService,
  DataStoreApplicationType,
  IDataStoreSection,
  StoreConfiguration,
  ErrorDataStore,
  ErrorModelStore,
  IModelStoreSection,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  IDataOrModelStore,
} from "miroir-core";
import { IndexedDbModelStoreSection } from "./4_services/IndexedDbModelStoreSection.js";
import { IndexedDbDataStoreSection } from "./4_services/IndexedDbDataStoreSection.js";
import { IndexedDb } from "./4_services/IndexedDbSnakeCase.js";
import { cleanLevel } from "./4_services/constants.js";
import { packageName } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"startup");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export function miroirStoreIndexedDbStartup() {
  ConfigurationService.registerStoreSectionFactory(
    "indexedDb",
    "model",
    async (
      section: ApplicationSection, // TODO: remove?
      config: StoreConfiguration,
      dataStore?: IDataStoreSection
    ): Promise<IDataOrModelStore> => {
      log.log('called registerStoreSectionFactory function for',section, config.emulatedServerType);
      
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
      config: StoreConfiguration,
      dataStore?: IDataStoreSection
    ): Promise<IDataOrModelStore> => {
      if (config.emulatedServerType == "indexedDb") {
        log.log('called registerStoreSectionFactory function for', config.emulatedServerType, config.indexedDbName);
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
