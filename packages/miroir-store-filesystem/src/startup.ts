import {
  ApplicationSection,
  ConfigurationServiceInner,
  ErrorAdminStore,
  ErrorDataStore,
  ErrorModelStore,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
  StoreSectionConfiguration
} from "miroir-core";
import { FileSystemAdminStore } from "./4_services/FileSystemAdminStore.js";
import { FileSystemDataStoreSection } from "./4_services/FileSystemDataStoreSection.js";
import { FileSystemModelStoreSection } from "./4_services/FileSystemModelStoreSection.js";
import { cleanLevel } from "./4_services/constants";
import { packageName } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "startup")
).then((logger: LoggerInterface) => {log = logger});


export function miroirFileSystemStoreSectionStartup(
  configurationService: ConfigurationServiceInner
) {
  configurationService.registerAdminStoreFactory(
    "filesystem",
    async (
      config: StoreSectionConfiguration,
      filesystemDeploymentRootDirectory: string,
    ): Promise<PersistenceStoreAdminSectionInterface> => {
      log.info(
        "called registerStoreSectionFactory function for filesystem admin store with filesystemDeploymentRootDirectory",
        filesystemDeploymentRootDirectory,
      );
      if (config.emulatedServerType == "filesystem") {
        const filesystemStoreName: string = config.directory;
        return Promise.resolve(
          new FileSystemAdminStore(
            "data",
            filesystemStoreName,
            filesystemDeploymentRootDirectory,
            config.directory,
          ),
        ); // TODO: provide adequate applicationSection! "admin"?
      } else {
        return Promise.resolve(new ErrorAdminStore());
      }
    },
  );
  configurationService.registerStoreSectionFactory(
    "filesystem",
    "model",
    async (
      section: ApplicationSection, // TODO: remove!
      config: StoreSectionConfiguration,
      filesystemDeploymentRootDirectory: string,
      dataStore?: PersistenceStoreDataSectionInterface
    ): Promise<PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface> => {
      log.info(
        "called registerStoreSectionFactory function for filesystem model store with filesystemDeploymentRootDirectory",
        filesystemDeploymentRootDirectory,
      );
      
      if (config.emulatedServerType == "filesystem" && dataStore) {
        const filesystemStoreName: string = config.directory
        log.info('called registerStoreSectionFactory function for',filesystemStoreName, 'filesystem');
        
        return Promise.resolve(
          config.emulatedServerType == "filesystem" && dataStore
            ? new FileSystemModelStoreSection(
                "model",
                filesystemStoreName,
                filesystemDeploymentRootDirectory,
                config.directory,
                dataStore,
              )
            : new ErrorModelStore(),
        );
      } else {
        return Promise.resolve(new ErrorModelStore())
      }
    }
  );
  configurationService.registerStoreSectionFactory(
    "filesystem",
    "data",
    async (
      section: ApplicationSection,
      config: StoreSectionConfiguration,
      filesystemDeploymentRootDirectory: string,
      dataStore?: PersistenceStoreDataSectionInterface
    ): Promise<PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface> => {
      if (config.emulatedServerType == "filesystem") {
        log.info(
          "called registerStoreSectionFactory function for filesystem data store with filesystemDeploymentRootDirectory",
          filesystemDeploymentRootDirectory,
        );
        const filesystemStoreName: string = config.directory
        return Promise.resolve(
          config.emulatedServerType == "filesystem"
            ? new FileSystemDataStoreSection(
                "data",
                filesystemStoreName,
                filesystemDeploymentRootDirectory,
                config.directory,
              )
            : new ErrorDataStore(),
        );
      } else {
        return Promise.resolve(new ErrorDataStore());
      }
    }
  );
}

// miroirAppStartup();
// miroirCoreStartup();
