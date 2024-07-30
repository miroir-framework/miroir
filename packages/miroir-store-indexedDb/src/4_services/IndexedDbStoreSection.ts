import {
  DataStoreApplicationType,
  EntityDefinition,
  AbstractStoreSectionInterface,
  StorageSpaceHandlerInterface,
  LoggerInterface,
  MetaEntity,
  MiroirLoggerFactory,
  getLoggerName,
  ActionReturnType,
  ActionVoidReturnType,
  ACTION_OK
} from "miroir-core";
import { packageName } from "../constants.js";
import { IndexedDb } from "./IndexedDb.js";
import { cleanLevel } from "./constants.js";
import { IndexedDbStore } from "./IndexedDbStore.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "IndexedDbStoreSection");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableIndexedDbStoreSection = GConstructor<IndexedDbStoreSection>;

// base class for IndexedDb store mixins
export class IndexedDbStoreSection
  extends IndexedDbStore
  implements AbstractStoreSectionInterface, StorageSpaceHandlerInterface
{
  // ##############################################################################################
  constructor(
    // public indexedDbStoreName: string; // used only for debugging purposes
    // public localUuidIndexedDb: IndexedDb;
    // public logHeader: string;
    ...args: any[] // mixin constructors are limited to args:any[] parameters
  ) {
    super(args[0], args[1], args[2]);
  }

  // ##################################################################################################
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<ActionVoidReturnType> {
    log.info(this.logHeader, "bootFromPersistedState does nothing!");
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async clear(): Promise<ActionVoidReturnType> {
    await this.localUuidIndexedDb.removeSubLevels(this.getEntityUuids());
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  getEntityUuids(): string[] {
    return this.localUuidIndexedDb.getSubLevels();
  }

  // #############################################################################################
  async createStorageSpaceForInstancesOfEntity(
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<ActionVoidReturnType> {
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
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  async dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<ActionVoidReturnType> {
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
    return Promise.resolve(ACTION_OK);
  }

  // ##############################################################################################
  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<ActionVoidReturnType> {
    log.warn(
      this.logHeader,
      "renameStorageSpaceForInstancesOfEntity does nothing for entity",
      oldName,
      ", since Entities are indexed by Uuid! Existing entities:",
      this.localUuidIndexedDb.getSubLevels()
    );
    return Promise.resolve(ACTION_OK);
  }
}
