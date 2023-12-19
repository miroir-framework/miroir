import {
  ApplicationSection,
  ConfigurationService,
  DataStoreApplicationType,
  StoreConfiguration,
  ErrorDataStore,
  ErrorModelStore,
  IDataSectionStore,
  IModelSectionStore,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
} from "miroir-core";
import { FileSystemDataSectionStore } from "./4_services/FileSystemDataSectionStore.js";
import { FileSystemModelSectionStore } from "./4_services/FileSystemModelSectionStore.js";
import { cleanLevel } from "./4_services/constants";
import { packageName } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"startup");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export function miroirStoreFileSystemStartup() {
  ConfigurationService.registerStoreFactory(
    "filesystem",
    "model",
    async (
      appName: string,
      dataStoreApplicationType: DataStoreApplicationType,
      section: ApplicationSection,
      config: StoreConfiguration,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      log.log('called registerStoreFactory function for',appName, section, 'filesystem');
      
      return Promise.resolve(
        config.emulatedServerType == "filesystem" && dataStore
          ? new FileSystemModelSectionStore(appName, dataStoreApplicationType, config.directory, dataStore)
          : new ErrorModelStore()
      )
    }
  );
  ConfigurationService.registerStoreFactory(
    "filesystem",
    "data",
    async (
      appName: string,
      dataStoreApplicationType: DataStoreApplicationType,
      section: ApplicationSection,
      config: StoreConfiguration,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      log.log('called registerStoreFactory function for',appName, section, 'filesystem');
      return Promise.resolve(
        config.emulatedServerType == "filesystem"
          ? new FileSystemDataSectionStore(appName, dataStoreApplicationType, config.directory)
          : new ErrorDataStore()
      )
    }
  );
}

// miroirAppStartup();
// miroirCoreStartup();
