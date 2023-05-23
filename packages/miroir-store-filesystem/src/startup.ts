import {
  ApplicationSection,
  ConfigurationService,
  DataStoreApplicationType,
  DataStoreInterface,
  EmulatedServerConfig,
  ErrorDataStore,
  ErrorModelStore,
  ModelStoreInterface,
} from "miroir-core";
import packageJson from "../package.json";
import { FileSystemModelStore } from "./3_controllers/FileSystemModelStore.js";
import { FileSystemDataStore } from "./3_controllers/FileSystemDataStore.js";

export function miroirStoreFileSystemStartup() {
  ConfigurationService.registerStoreFactory(
    "filesystem",
    "model",
    async (
      appName: string,
      dataStoreApplicationType: DataStoreApplicationType,
      section: ApplicationSection,
      config: EmulatedServerConfig,
      dataStore?: DataStoreInterface
    ): Promise<DataStoreInterface | ModelStoreInterface> => {
      console.log('called registerStoreFactory function for filesystem, model');
      
      return Promise.resolve(
        config.emulatedServerType == "filesystem" && dataStore
          ? new FileSystemModelStore(appName, dataStoreApplicationType, config.directory, dataStore)
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
      config: EmulatedServerConfig,
      dataStore?: DataStoreInterface
    ): Promise<DataStoreInterface | ModelStoreInterface> =>
      Promise.resolve(
        config.emulatedServerType == "filesystem"
          ? new FileSystemDataStore(appName, dataStoreApplicationType, config.directory)
          : new ErrorDataStore()
      )
  );
}

// miroirAppStartup();
// miroirCoreStartup();
