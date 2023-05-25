import {
  ApplicationSection,
  ConfigurationService,
  DataStoreApplicationType,
  IDataSectionStore,
  EmulatedServerConfig,
  ErrorDataStore,
  ErrorModelStore,
  IModelSectionStore,
} from "miroir-core";
import packageJson from "../package.json";
import { FileSystemModelSectionStore } from "./3_controllers/FileSystemModelSectionStore.js";
import { FileSystemDataSectionStore } from "./3_controllers/FileSystemDataSectionStore.js";

export function miroirStoreFileSystemStartup() {
  ConfigurationService.registerStoreFactory(
    "filesystem",
    "model",
    async (
      appName: string,
      dataStoreApplicationType: DataStoreApplicationType,
      section: ApplicationSection,
      config: EmulatedServerConfig,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      console.log('called registerStoreFactory function for',appName, section, 'filesystem');
      
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
      config: EmulatedServerConfig,
      dataStore?: IDataSectionStore
    ): Promise<IDataSectionStore | IModelSectionStore> => {
      console.log('called registerStoreFactory function for',appName, section, 'filesystem');
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
