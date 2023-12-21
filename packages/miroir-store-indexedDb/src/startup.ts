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
  IDataOrModelStore,
} from "miroir-core";
import { IndexedDbModelSectionStore } from "./4_services/IndexedDbModelSectionStore.js";
import { IndexedDbDataSectionStore } from "./4_services/IndexedDbDataSectionStore.js";
import { IndexedDb } from "./4_services/IndexedDbSnakeCase.js";
import { cleanLevel } from "./4_services/constants.js";
import { packageName } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"startup");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export function miroirStoreIndexedDbStartup() {
  ConfigurationService.registerStoreFactory(
    "indexedDb",
    "model",
    async (
      section: ApplicationSection, // TODO: remove?
      config: StoreConfiguration,
      dataStore?: IDataSectionStore
    ): Promise<IDataOrModelStore> => {
      log.log('called registerStoreFactory function for',section, config.emulatedServerType);
      
      if (config.emulatedServerType == "indexedDb" && dataStore) {
        const indexedDbStoreName = config.indexedDbName + '-model'
        // const db = new IndexedDbModelSectionStore(appName, dataStoreApplicationType, new IndexedDb(indexedDbStoreName), dataStore)
        const db = new IndexedDbModelSectionStore(indexedDbStoreName, new IndexedDb(indexedDbStoreName), dataStore)
        // db.open()
        return db;
      } else {
        return new ErrorModelStore()
      }
    }
  );
  ConfigurationService.registerStoreFactory(
    "indexedDb",
    "data",
    async (
      section: ApplicationSection, // TODO: remove?
      config: StoreConfiguration,
      dataStore?: IDataSectionStore
    ): Promise<IDataOrModelStore> => {
      if (config.emulatedServerType == "indexedDb") {
        log.log('called registerStoreFactory function for', config.emulatedServerType, config.indexedDbName);
        const indexedDbStoreName = config.indexedDbName + '-data'
        const db = new IndexedDbDataSectionStore(indexedDbStoreName, new IndexedDb(indexedDbStoreName))
        // db.open()
        return db;
      } else {
        log.warn('called registerStoreFactory data for', config);
        return new ErrorDataStore()
      }
    }
  );
}
