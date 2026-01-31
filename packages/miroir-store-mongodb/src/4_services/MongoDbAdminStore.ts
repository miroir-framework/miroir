import {
  ACTION_OK,
  Action2VoidReturnType,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  StoreSectionConfiguration
} from "miroir-core";
import { packageName } from "../constants.js";
import { MongoDbStore } from "./MongoDbStore.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MongoDbAdminStore")
).then((logger: LoggerInterface) => {log = logger});

/**
 * Admin store implementation for MongoDB.
 * Handles store creation and deletion operations.
 */
export class MongoDbAdminStore extends MongoDbStore implements PersistenceStoreAdminSectionInterface {
  // For the sake of uniformity, we follow the mixin pattern also for this class although it's not mixed in any other class

  // ##############################################################################################
  constructor(
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2]);
  }

  // ##############################################################################################
  async createStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    // MongoDB creates databases and collections automatically when first written to.
    // The storeSectionFactory handles MongoDb instantiation.
    log.info(this.logHeader, "createStore called for config:", config);
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async deleteStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "deleteStore called for config:", config);
    // Drop the database when store is deleted
    if (this.localUuidMongoDb.db) {
      try {
        await this.localUuidMongoDb.db.dropDatabase();
        log.info(this.logHeader, "deleteStore dropped database");
      } catch (error) {
        log.warn(this.logHeader, "deleteStore error dropping database:", error);
      }
    }
    return Promise.resolve(ACTION_OK);
  }
}
