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
      section: ApplicationSection, // TODO: remove!
      config: StoreConfiguration,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      
      if (config.emulatedServerType == "filesystem" && dataStore) {
        const filesystemStoreName: string = config.directory
        log.log('called registerStoreFactory function for',filesystemStoreName, 'filesystem');
        
        return Promise.resolve(
          config.emulatedServerType == "filesystem" && dataStore
            ? new FileSystemModelSectionStore(filesystemStoreName, config.directory, dataStore)
            : new ErrorModelStore()
        )
      } else {
        return Promise.resolve(new ErrorModelStore())
      }
    }
  );
  ConfigurationService.registerStoreFactory(
    "filesystem",
    "data",
    async (
      section: ApplicationSection,
      config: StoreConfiguration,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      if (config.emulatedServerType == "filesystem") {
        log.log('called registerStoreFactory function for', 'filesystem');
        const filesystemStoreName: string = config.directory
        return Promise.resolve(
          config.emulatedServerType == "filesystem"
            ? new FileSystemDataSectionStore(filesystemStoreName, config.directory)
            : new ErrorDataStore()
        )
      } else {
        return Promise.resolve(new ErrorDataStore());
      }
    }
  );
}

// miroirAppStartup();
// miroirCoreStartup();
