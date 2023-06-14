
// TODO: put in ConfigurationServiceInterface

import { ApplicationSection } from "../0_interfaces/1_core/Instance.js";
import { EmulatedServerConfig } from "../0_interfaces/1_core/MiroirConfig.js";
import { StorageType } from "../0_interfaces/1_core/StorageConfiguration.js";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface.js";
import { IDataSectionStore, IModelSectionStore } from "../0_interfaces/4-services/remoteStore/IStoreController.js";

// export type DeploymentModes = 'local' | 'remote';
export type cacheInvalidationPolicy = 'routing' | 'periodic' | 'never';
export type cacheFetchPolicy = 'onDemand' |'routing' | 'periodic' | 'never';
export type undoRedoHistorization = 'actions' |'snapshot' | 'periodic' | 'never'; // what does it make sense for? An Entity?


export interface PackageConfiguration {
  packageName: string;
  packageVersion: string;
}

export type StoreFactory = (
  appName: string,
  dataStoreApplicationType: DataStoreApplicationType,
  section:ApplicationSection,
  config: EmulatedServerConfig,
  dataStore?: IDataSectionStore,
)=>Promise<IDataSectionStore | IModelSectionStore>;

export type StoreFactoryRegister = Map<string,StoreFactory>;

/**
 * Allows Miroir packages to inject (and access?) configuration information.
 */
export class ConfigurationService {
  static packages:PackageConfiguration[] = [];
  static storeFactoryRegister:StoreFactoryRegister = new Map();

  constructor() {
    
  }

  /**
   * registerPackageConfiguration
   */
  public static registerPackageConfiguration(packageConfiguration: PackageConfiguration) {
    console.log("ConfigurationService registerPackageConfiguration",packageConfiguration);
    this.packages.push(packageConfiguration);
  }

  public static registerStoreFactory(storageType:StorageType, section: ApplicationSection, storeFactory: StoreFactory) {
    console.log("ConfigurationService registerStoreFactory",this.storeFactoryRegister);
    this.storeFactoryRegister.set(
      JSON.stringify({storageType, section}), storeFactory
    );
  }

}