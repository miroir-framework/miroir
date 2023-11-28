
// TODO: put in ConfigurationServiceInterface

import { EmulatedServerConfig } from "../0_interfaces/1_core/MiroirConfig.js";
import { StorageType } from "../0_interfaces/1_core/StorageConfiguration.js";
import { ApplicationSection } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DataStoreApplicationType } from "../0_interfaces/3_controllers/ApplicationControllerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { IDataSectionStore, IModelSectionStore, IDataOrModelStore } from "../0_interfaces/4-services/remoteStore/IStoreController.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"ConfigurationService");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

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
)=>Promise<IDataOrModelStore>;

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
    log.info("ConfigurationService registerPackageConfiguration",packageConfiguration);
    this.packages.push(packageConfiguration);
  }

  public static registerStoreFactory(storageType:StorageType, section: ApplicationSection, storeFactory: StoreFactory) {
    log.info("ConfigurationService registerStoreFactory",this.storeFactoryRegister);
    this.storeFactoryRegister.set(
      JSON.stringify({storageType, section}), storeFactory
    );
  }

}