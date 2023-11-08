import { DataStoreApplicationType, IDataSectionStore, EntityDefinition, EntityInstance, IAbstractEntityStore, IAbstractInstanceStore, IAbstractStore, MetaEntity, WrappedTransactionalEntityUpdateWithCUDUpdate, entityEntity, entityEntityDefinition, IStorageSpaceHandler } from "miroir-core";
import { IndexedDb } from "./indexedDb.js";

type GConstructor<T = {}> = new (...args: any[]) => T;

export type MixableIndexedDbStore = GConstructor<IndexedDbStore>;

// base class for IndexedDb store mixins
export class IndexedDbStore implements IAbstractStore, IStorageSpaceHandler {
  public applicationName: string;
  public dataStoreType: DataStoreApplicationType;
  public localUuidIndexedDb: IndexedDb;
  public logHeader: string;

  // ##############################################################################################
  constructor(
    // public applicationName: string;
    // public dataStoreType: DataStoreApplicationType;
    // public localUuidIndexedDb: IndexedDb;
    // public logHeader: string;
    ...args:any[] // mixin constructors are limited to args:any[] parameters
  ) {
    this.applicationName = args[0];
    this.dataStoreType = args[1];
    this.localUuidIndexedDb = args[2];
    this.logHeader = args[3];
    // console.log(this.logHeader,'IndexedDbStore constructor','this.localUuidIndexedDb',this.localUuidIndexedDb)
  }
  
  // ##################################################################################################
  async open(): Promise<void> {
    console.log(this.logHeader,'open(): opening');
    await this.localUuidIndexedDb.openObjectStore();
    console.log(this.logHeader,'open(): opened');
    return Promise.resolve();
  }

  // ##############################################################################################
  async close():Promise<void> {
    console.log(this.logHeader,'close(): closing');
    await this.localUuidIndexedDb.closeObjectStore();
    console.log(this.logHeader,'close(): closed');
      return Promise.resolve();
  }

  // ##################################################################################################
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    console.log(this.logHeader,'bootFromPersistedState does nothing!');
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
    console.log(
      this.logHeader,
      "createStorageSpaceForInstancesOfEntity",
      // "dataStoreType",
      // this.dataStoreType,
      "input: entity",
      entity,
      "entityDefinition",
      entityDefinition,
      "Entities",
      this.localUuidIndexedDb.getSubLevels()
    );
    if (entity.uuid != entityDefinition.entityUuid) {
      // inconsistent input, raise exception
      console.error(
        this.logHeader,
        "createStorageSpaceForInstancesOfEntity",
        "Application",
        this.applicationName,
        "dataStoreType",
        this.dataStoreType,
        "inconsistent input: given entityDefinition is not related to given entity."
      );
    } else {
      if (!this.localUuidIndexedDb.hasSubLevel(entity.uuid)) {
        this.localUuidIndexedDb.addSubLevels([entity.uuid]);
      } else {
        this.localUuidIndexedDb.db?.sublevel(entity.uuid).clear();
        console.log(
          this.logHeader,
          "createStorageSpaceForInstancesOfEntity",
          "dataStoreType",
          this.dataStoreType,
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
      console.warn(
        this.logHeader,
        "dropStorageSpaceForInstancesOfEntity",
        "input: entity",
        entityUuid,
        "removed sublevel. Remaining sublevels:",
        this.localUuidIndexedDb.getSubLevels()
      );
    } else {
      console.warn(
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
    console.warn(
      this.logHeader,
      "renameStorageSpaceForInstancesOfEntity does nothing for entity",
      oldName,
      ", since Entities are indexed by Uuid! Existing entities:",
      this.localUuidIndexedDb.getSubLevels()
    );
    return Promise.resolve();
  }
}


