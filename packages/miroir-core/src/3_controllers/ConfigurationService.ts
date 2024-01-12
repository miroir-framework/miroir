
// TODO: put in ConfigurationServiceInterface

import { StorageType } from "../0_interfaces/1_core/StorageConfiguration.js";
import { ApplicationSection, StoreSectionConfiguration } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { AdminStoreInterface, IDataOrModelStore, StoreSectionFactory, StoreSectionFactoryRegister } from "../0_interfaces/4-services/StoreControllerInterface.js";
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


// ###############################################################################################################
// export type AdminStoreFactory = (config: StoreSectionConfiguration,
//   ) => AdminStoreInterface

export type AdminStoreFactory = (
  section:ApplicationSection,
  config: StoreSectionConfiguration,
)=>Promise<AdminStoreInterface>;

export type AdminStoreFactoryRegister = Map<string,AdminStoreFactory>;


// ###############################################################################################################
/**
 * Allows Miroir packages to inject (and access?) configuration information.
 */
export class ConfigurationService {
  static packages:PackageConfiguration[] = [];
  static StoreSectionFactoryRegister:StoreSectionFactoryRegister = new Map();
  static adminStoreFactoryRegister:AdminStoreFactoryRegister = new Map();

  constructor() {
    
  }

  /**
   * registerPackageConfiguration
   */
  public static registerPackageConfiguration(packageConfiguration: PackageConfiguration) {
    log.info("ConfigurationService registerPackageConfiguration",packageConfiguration);
    this.packages.push(packageConfiguration);
  }

  public static registerStoreSectionFactory(storageType:StorageType, section: ApplicationSection, storeSectionFactory: StoreSectionFactory) {
    log.info("ConfigurationService registerStoreSectionFactory",this.StoreSectionFactoryRegister);
    this.StoreSectionFactoryRegister.set(
      JSON.stringify({storageType, section}), storeSectionFactory
    );
  }

  public static registerAdminStoreFactory(storageType:StorageType, adminStoreFactory: AdminStoreFactory) {
    log.info("ConfigurationService registerAdminStoreFactory",this.StoreSectionFactoryRegister);
    this.adminStoreFactoryRegister.set(
      JSON.stringify({storageType}), adminStoreFactory
    );
  }

}