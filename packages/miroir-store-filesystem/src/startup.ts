import {
  ApplicationSection,
  ConfigurationService,
  StoreSectionConfiguration,
  ErrorDataStore,
  ErrorModelStore,
  StoreDataSectionInterface,
  StoreModelSectionInterface,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName,
  AdminStoreInterface,
  ErrorAdminStore,
} from "miroir-core";
import { FileSystemDataStoreSection } from "./4_services/FileSystemDataStoreSection.js";
import { FileSystemModelStoreSection } from "./4_services/FileSystemModelStoreSection.js";
import { cleanLevel } from "./4_services/constants";
import { packageName } from "./constants";
import { FileSystemAdminStore } from "./4_services/FileSystemAdminStore.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"startup");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export function miroirFileSystemStoreSectionStartup() {
  ConfigurationService.registerAdminStoreFactory(
    "filesystem",
    async (config: StoreSectionConfiguration): Promise<AdminStoreInterface> => {
      if (config.emulatedServerType == "filesystem") {
        const filesystemStoreName: string = config.directory
        // return Promise.resolve(new SqlDbAdminStore(sqlDbStoreName, config.connectionString, config.schema))
        return Promise.resolve(new FileSystemAdminStore(filesystemStoreName, config.directory))
      } else {
        return Promise.resolve(new ErrorAdminStore())
      }
    }
  )
  ConfigurationService.registerStoreSectionFactory(
    "filesystem",
    "model",
    async (
      section: ApplicationSection, // TODO: remove!
      config: StoreSectionConfiguration,
      dataStore?: StoreDataSectionInterface
    ): Promise<StoreDataSectionInterface | StoreModelSectionInterface> => {
      
      if (config.emulatedServerType == "filesystem" && dataStore) {
        const filesystemStoreName: string = config.directory
        log.info('called registerStoreSectionFactory function for',filesystemStoreName, 'filesystem');
        
        return Promise.resolve(
          config.emulatedServerType == "filesystem" && dataStore
            ? new FileSystemModelStoreSection(filesystemStoreName, config.directory, dataStore)
            : new ErrorModelStore()
        )
      } else {
        return Promise.resolve(new ErrorModelStore())
      }
    }
  );
  ConfigurationService.registerStoreSectionFactory(
    "filesystem",
    "data",
    async (
      section: ApplicationSection,
      config: StoreSectionConfiguration,
      dataStore?: StoreDataSectionInterface
    ): Promise<StoreDataSectionInterface | StoreModelSectionInterface> => {
      if (config.emulatedServerType == "filesystem") {
        log.info('called registerStoreSectionFactory function for', 'filesystem');
        const filesystemStoreName: string = config.directory
        return Promise.resolve(
          config.emulatedServerType == "filesystem"
            ? new FileSystemDataStoreSection(filesystemStoreName, config.directory)
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
