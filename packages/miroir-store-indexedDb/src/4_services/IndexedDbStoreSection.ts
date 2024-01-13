import {
  DataStoreApplicationType,
  EntityDefinition,
  AbstractStoreSectionInterface,
  StorageSpaceHandlerInterface,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import { packageName } from "../constants";
import { IndexedDb } from "./IndexedDbSnakeCase";
import { cleanLevel } from "./constants";
import { IndexedDbStore } from "./IndexedDbStore";

const loggerName: string = getLoggerName(packageName, cleanLevel, "IndexedDbStoreSection");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableIndexedDbStoreSection = GConstructor<IndexedDbStoreSection>;

// base class for IndexedDb store mixins
export class IndexedDbStoreSection extends IndexedDbStore implements AbstractStoreSectionInterface, StorageSpaceHandlerInterface {
  // public indexedDbStoreName: string;
  // public localUuidIndexedDb: IndexedDb;
  // public logHeader: string;

  // ##############################################################################################
  constructor(
    // public indexedDbStoreName: string; // used only for debugging purposes
    // public localUuidIndexedDb: IndexedDb;
    // public logHeader: string;
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2])
    // this.indexedDbStoreName = args[0];
    // this.localUuidIndexedDb = args[1];
    // this.logHeader = args[2];
    // log.info(this.logHeader,'IndexedDbStoreSection constructor','this.localUuidIndexedDb',this.localUuidIndexedDb)
  }

  //   // #########################################################################################
  //   getStoreName(): string {
  //     return this.indexedDbStoreName;
  //   }
  
  
  // // ##################################################################################################
  // async open(): Promise<void> {
  //   log.info(this.logHeader, "open(): opening");
  //   await this.localUuidIndexedDb.openObjectStore();
  //   log.info(this.logHeader, "open(): opened");
  //   return Promise.resolve();
  // }

  // // ##############################################################################################
  // async close(): Promise<void> {
  //   log.info(this.logHeader, "close(): closing");
  //   await this.localUuidIndexedDb.closeObjectStore();
  //   log.info(this.logHeader, "close(): closed");
  //   return Promise.resolve();
  // }

  // ##################################################################################################
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    log.info(this.logHeader, "bootFromPersistedState does nothing!");
    return Promise.resolve();
  }

  // ##############################################################################################
  async clear(): Promise<void> {
    await this.localUuidIndexedDb.removeSubLevels(this.getEntityUuids());
    return Promise.resolve();
  }

  // ##############################################################################################
  getEntityUuids(): string[] {
    return this.localUuidIndexedDb.getSubLevels();
  }

  // #############################################################################################
  async createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition) {
    log.info(
      this.logHeader,
      "createStorageSpaceForInstancesOfEntity",
      "input: entity",
      entity,
      "entityDefinition",
      entityDefinition,
      "Entities",
      this.localUuidIndexedDb.getSubLevels()
    );
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      log.error(
        this.logHeader,
        "createStorageSpaceForInstancesOfEntity",
        "inconsistent input: given entityDefinition is not related to given entity."
      );
    } else {
      if (!this.localUuidIndexedDb.hasSubLevel(entity.uuid)) {
        this.localUuidIndexedDb.addSubLevels([entity.uuid]);
      } else {
        this.localUuidIndexedDb.db?.sublevel(entity.uuid).clear();
        log.debug(
          this.logHeader,
          "createStorageSpaceForInstancesOfEntity",
          "input: entity",
          entity,
          "entityDefinition",
          entityDefinition,
          "already has entity. Existing entities:",
          this.localUuidIndexedDb.getSubLevels()
        );
      }
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  async dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void> {
    if (this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
      await this.localUuidIndexedDb.removeSubLevels([entityUuid]);
      log.warn(
        this.logHeader,
        "dropStorageSpaceForInstancesOfEntity",
        "input: entity",
        entityUuid,
        "removed sublevel. Remaining sublevels:",
        this.localUuidIndexedDb.getSubLevels()
      );
    } else {
      log.warn(
        this.logHeader,
        "dropStorageSpaceForInstancesOfEntity",
        "input: entity",
        entityUuid,
        "not found. Existing entities:",
        this.localUuidIndexedDb.getSubLevels()
      );
    }
    return Promise.resolve();
  }

  // ##############################################################################################
  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<void> {
    log.warn(
      this.logHeader,
      "renameStorageSpaceForInstancesOfEntity does nothing for entity",
      oldName,
      ", since Entities are indexed by Uuid! Existing entities:",
      this.localUuidIndexedDb.getSubLevels()
    );
    return Promise.resolve();
  }
}
