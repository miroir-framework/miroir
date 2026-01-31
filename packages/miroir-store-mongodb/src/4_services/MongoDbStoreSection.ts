import {
  ACTION_OK,
  Action2VoidReturnType,
  EntityDefinition,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  PersistenceStoreAbstractSectionInterface,
  StorageSpaceHandlerInterface
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { MongoDbStore } from "./MongoDbStore.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MongoDbStoreSection")
).then((logger: LoggerInterface) => {log = logger});

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableMongoDbStoreSection = GConstructor<MongoDbStoreSection>;

/**
 * Base class for MongoDB store mixins.
 * Implements PersistenceStoreAbstractSectionInterface and StorageSpaceHandlerInterface.
 * Collections are created/managed per Entity UUID.
 */
export class MongoDbStoreSection
  extends MongoDbStore
  implements PersistenceStoreAbstractSectionInterface, StorageSpaceHandlerInterface
{
  // ##############################################################################################
  constructor(
    // public mongoDbStoreName: string;
    // public localUuidMongoDb: MongoDb;
    // public logHeader: string;
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2]);
  }

  // ##################################################################################################
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<Action2VoidReturnType> {
    log.info(this.logHeader, "bootFromPersistedState does nothing!");
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async clear(): Promise<Action2VoidReturnType> {
    await this.localUuidMongoDb.removeCollections(this.getEntityUuids());
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  getEntityUuids(): string[] {
    return this.localUuidMongoDb.getCollections();
  }

  // #############################################################################################
  async createStorageSpaceForInstancesOfEntity(
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<Action2VoidReturnType> {
    log.info(
      this.logHeader,
      "createStorageSpaceForInstancesOfEntity",
      "input: entity",
      entity,
      "entityDefinition",
      entityDefinition,
      "Entities",
      this.localUuidMongoDb.getCollections()
    );
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      log.error(
        this.logHeader,
        "createStorageSpaceForInstancesOfEntity",
        "inconsistent input: given entityDefinition is not related to given entity."
      );
    } else {
      if (!this.localUuidMongoDb.hasCollection(entity.uuid)) {
        this.localUuidMongoDb.addCollections([entity.uuid]);
      } else {
        // Clear existing collection
        if (this.localUuidMongoDb.db) {
          await this.localUuidMongoDb.db.collection(entity.uuid).deleteMany({});
        }
        log.debug(
          this.logHeader,
          "createStorageSpaceForInstancesOfEntity",
          "input: entity",
          entity,
          "entityDefinition",
          entityDefinition,
          "already has entity. Existing entities:",
          this.localUuidMongoDb.getCollections()
        );
      }
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<Action2VoidReturnType> {
    if (this.localUuidMongoDb.hasCollection(entityUuid)) {
      await this.localUuidMongoDb.removeCollections([entityUuid]);
      log.warn(
        this.logHeader,
        "dropStorageSpaceForInstancesOfEntity",
        "input: entity",
        entityUuid,
        "removed collection. Remaining collections:",
        this.localUuidMongoDb.getCollections()
      );
    } else {
      log.warn(
        this.logHeader,
        "dropStorageSpaceForInstancesOfEntity",
        "input: entity",
        entityUuid,
        "not found. Existing entities:",
        this.localUuidMongoDb.getCollections()
      );
    }
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<Action2VoidReturnType> {
    log.warn(
      this.logHeader,
      "renameStorageSpaceForInstancesOfEntity does nothing for entity",
      oldName,
      ", since Entities are indexed by Uuid! Existing entities:",
      this.localUuidMongoDb.getCollections()
    );
    return Promise.resolve(ACTION_OK);
  }
}
