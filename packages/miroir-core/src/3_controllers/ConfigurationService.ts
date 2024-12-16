
// TODO: put in ConfigurationServiceInterface

import { StorageType } from "../0_interfaces/1_core/StorageConfiguration.js";
import { TestImplementation } from "../0_interfaces/1_core/TestImplementation.js";
import { ApplicationSection, StoreSectionConfiguration } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { PersistenceStoreAdminSectionFactory, AdminStoreFactoryRegister, PersistenceStoreAdminSectionInterface, PersistenceStoreDataOrModelSectionInterface, PersistenceStoreSectionFactory, StoreSectionFactoryRegister } from "../0_interfaces/4-services/PersistenceStoreControllerInterface.js";
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
/**
 * Allows Miroir packages to inject (and access?) configuration information.
 */
export class ConfigurationService {
  static packages:PackageConfiguration[] = [];
  static StoreSectionFactoryRegister:StoreSectionFactoryRegister = new Map();
  static adminStoreFactoryRegister:AdminStoreFactoryRegister = new Map();
  static testImplementation:TestImplementation | undefined = undefined;

  constructor() {
    
  }

  /**
   * registerPackageConfiguration
   */
  public static registerPackageConfiguration(packageConfiguration: PackageConfiguration) {
    log.info("ConfigurationService registerPackageConfiguration",packageConfiguration);
    this.packages.push(packageConfiguration);
  }

  public static registerStoreSectionFactory(storageType:StorageType, section: ApplicationSection, storeSectionFactory: PersistenceStoreSectionFactory) {
    log.info("ConfigurationService registerStoreSectionFactory",this.StoreSectionFactoryRegister);
    this.StoreSectionFactoryRegister.set(
      JSON.stringify({storageType, section}), storeSectionFactory
    );
  }

  public static registerAdminStoreFactory(storageType:StorageType, adminStoreFactory: PersistenceStoreAdminSectionFactory) {
    log.info("ConfigurationService registerAdminStoreFactory in",this.adminStoreFactoryRegister);
    this.adminStoreFactoryRegister.set(
      JSON.stringify({storageType}), adminStoreFactory
      );
    log.info("ConfigurationService registered in registerAdminStoreFactory",this.adminStoreFactoryRegister);
  }

  public static registerTestImplementation(implement:TestImplementation) {
    log.info("ConfigurationService registerTestImplementation in",implement);
    this.testImplementation = implement;
    log.info("ConfigurationService registered in registerTestImplementation",this.testImplementation);
  }

}