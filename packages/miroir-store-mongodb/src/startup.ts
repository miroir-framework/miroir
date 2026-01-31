import {
  ApplicationSection,
  ConfigurationService,
  ErrorAdminStore,
  ErrorDataStore,
  ErrorModelStore,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreDataOrModelSectionInterface,
  PersistenceStoreDataSectionInterface,
  StoreSectionConfiguration
} from "miroir-core";
import { MongoDb } from "./4_services/MongoDb.js";
import { MongoDbAdminStore } from "./4_services/MongoDbAdminStore.js";
import { MongoDbDataStoreSection } from "./4_services/MongoDbDataStoreSection.js";
import { MongoDbModelStoreSection } from "./4_services/MongoDbModelStoreSection.js";
import { cleanLevel } from "./4_services/constants.js";
import { packageName } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "startup")
).then((logger: LoggerInterface) => {log = logger});

/**
 * Type guard for MongoDB configuration
 */
function isMongoDbConfig(config: StoreSectionConfiguration): config is StoreSectionConfiguration & {
  emulatedServerType: "mongodb";
  connectionString: string;
  database: string;
} {
  return config.emulatedServerType === "mongodb" && 
    "connectionString" in config && 
    "database" in config;
}

/**
 * Registers MongoDB store factories with the ConfigurationService.
 * This function should be called during application startup to enable MongoDB persistence.
 */
export function miroirMongoDbStoreSectionStartup() {
  ConfigurationService.registerAdminStoreFactory(
    "mongodb",
    async (config: StoreSectionConfiguration): Promise<PersistenceStoreAdminSectionInterface> => {
      if (isMongoDbConfig(config)) {
        const mongoDbStoreName: string = config.database + '-admin';
        return Promise.resolve(new MongoDbAdminStore(
          mongoDbStoreName, 
          new MongoDb("data", config.connectionString, mongoDbStoreName),
          "MongoDbAdminStore " + mongoDbStoreName
        ));
      } else {
        return Promise.resolve(new ErrorAdminStore());
      }
    }
  );

  ConfigurationService.registerStoreSectionFactory(
    "mongodb",
    "model",
    async (
      section: ApplicationSection,
      config: StoreSectionConfiguration,
      dataStore?: PersistenceStoreDataSectionInterface
    ): Promise<PersistenceStoreDataOrModelSectionInterface> => {
      log.info('called registerStoreSectionFactory model function for', section, config.emulatedServerType);
      
      if (isMongoDbConfig(config) && dataStore) {
        const mongoDbStoreName = config.database + '-model';
        const db = new MongoDbModelStoreSection(
          mongoDbStoreName, 
          new MongoDb("model", config.connectionString, mongoDbStoreName), 
          dataStore
        );
        return Promise.resolve(db);
      } else {
        log.warn('called registerStoreSectionFactory model for', section, config, "returns ErrorModelStore!");
        return Promise.resolve(new ErrorModelStore());
      }
    }
  );

  ConfigurationService.registerStoreSectionFactory(
    "mongodb",
    "data",
    async (
      section: ApplicationSection,
      config: StoreSectionConfiguration,
      dataStore?: PersistenceStoreDataSectionInterface
    ): Promise<PersistenceStoreDataOrModelSectionInterface> => {
      if (isMongoDbConfig(config)) {
        log.info('called registerStoreSectionFactory data function for', section, config);
        const mongoDbStoreName = config.database + '-data';
        const db = new MongoDbDataStoreSection(
          mongoDbStoreName, 
          new MongoDb("data", config.connectionString, mongoDbStoreName)
        );
        return Promise.resolve(db);
      } else {
        log.warn('called registerStoreSectionFactory data for', section, config, "returns ErrorDataStore!");
        return Promise.resolve(new ErrorDataStore());
      }
    }
  );
}
