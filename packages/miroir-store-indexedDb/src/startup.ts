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
import { IndexedDbModelSectionStore } from "./4_services/IndexedDbModelSectionStore.js";
import { IndexedDbDataSectionStore } from "./4_services/IndexedDbDataSectionStore.js";
import { IndexedDb } from "./4_services/IndexedDb.js";
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
      appName: string,
      dataStoreApplicationType: DataStoreApplicationType,
      section: ApplicationSection,
      config: EmulatedServerConfig,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      log.log('called registerStoreFactory function for',appName, section, config.emulatedServerType);
      
      if (config.emulatedServerType == "indexedDb" && dataStore) {
        const db = new IndexedDbModelSectionStore(appName, dataStoreApplicationType, new IndexedDb(config.indexedDbName + '-model'), dataStore)
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
      appName: string,
      dataStoreApplicationType: DataStoreApplicationType,
      section: ApplicationSection,
      config: EmulatedServerConfig,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      log.log('called registerStoreFactory function for',appName, section, config.emulatedServerType);
      if (config.emulatedServerType == "indexedDb") {
        const db = new IndexedDbDataSectionStore(appName, dataStoreApplicationType, new IndexedDb(config.indexedDbName + '-data'))
        // db.open()
        return db;
      } else {
        return new ErrorDataStore()
      }
    }
  );
}
