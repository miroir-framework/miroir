import {
  DataStoreApplicationType,
  DataStoreInterface,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  MetaEntity,
} from "miroir-core";
import { IndexedDb } from "./indexedDb.js";

export class IndexedDbDataStore implements DataStoreInterface {
  private logHeader: string;

  // ##############################################################################################
  constructor(
    public applicationName: string,
    public dataStoreType: DataStoreApplicationType,
    private localUuidIndexedDb: IndexedDb
  ) {
    this.logHeader =
      "IndexedDbDataStore" + " Application " + this.applicationName + " dataStoreType " + this.dataStoreType;
  }

  // ##############################################################################################
  async connect(): Promise<void> {
    console.log(this.logHeader, "connect(): opening");
    await this.localUuidIndexedDb.openObjectStore();
    console.log(this.logHeader, "connect(): opened");
    return Promise.resolve();
  }

  // ##############################################################################################
  async close(): Promise<void> {
    console.log(this.logHeader, "close(): closing");
    await this.localUuidIndexedDb.closeObjectStore();
    console.log(this.logHeader, "close(): closed");
    return Promise.resolve();
  }

  // ##############################################################################################
  async bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    console.log(this.logHeader, "bootFromPersistedState does nothing!");
    return Promise.resolve();
  }
  // #############################################################################################
  async createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition) {
    console.log(
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
    if (!this.localUuidIndexedDb.hasSubLevel(entityUuid)) {
      await this.localUuidIndexedDb.removeSubLevels([entityUuid]);
      // this.localUuidIndexedDb.db?.sublevel(entityUuid).clear();
    } else {
      console.log(
        this.logHeader,
        "createStorageSpaceForInstancesOfEntity",
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

  // ##############################################################################################
  getEntityNames(): string[] {
    throw new Error("Method not implemented.");
  }
  // ##############################################################################################
  getEntityUuids(): string[] {
    return this.localUuidIndexedDb.getSubLevels();
  }

  // ##############################################################################################
  async getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    let result = {};
    console.log(this.logHeader, "getState this.getEntities()", this.getEntityUuids());

    for (const parentUuid of this.getEntityUuids()) {
      console.log(this.logHeader, "getState getting instances for", parentUuid);
      const instances = await this.getInstances(parentUuid);
      console.log(this.logHeader, "getState found instances", parentUuid, instances);

      Object.assign(result, { [parentUuid]: instances });
    }
    return Promise.resolve(result);
  }

  // #############################################################################################
  async getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    const result = await this.localUuidIndexedDb.getValue(parentUuid, uuid);
    return Promise.resolve(result);
  }

  // #############################################################################################
  async getInstances(parentUuid: string): Promise<any> {
    const result = await this.localUuidIndexedDb.getAllValue(parentUuid);
    return Promise.resolve(result);
  }

  // #############################################################################################
  async upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log(this.logHeader, "upsertInstance", instance.parentUuid, instance);

    if (this.localUuidIndexedDb.hasSubLevel(parentUuid)) {
      await this.localUuidIndexedDb.putValue(parentUuid, instance);
    } else {
      console.error(this.logHeader, "upsertInstance", instance.parentUuid, "does not exists.");
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    console.log(this.logHeader, "deleteInstances", parentUuid, instances);
    for (const o of instances) {
      // await this.localUuidIndexedDb.deleteValue(parentUuid, o.uuid);
      await this.deleteInstance(parentUuid, { uuid: o.uuid } as EntityInstance);
    }
    return Promise.resolve();
  }

  // #############################################################################################
  async deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    console.log(this.logHeader, "deleteDataInstance", parentUuid, instance);
    // for (const o of instances) {
    await this.localUuidIndexedDb.deleteValue(parentUuid, instance.uuid);
    // }
    return Promise.resolve();
  }

  // ##############################################################################################
  async dropData(): Promise<void> {
    await this.localUuidIndexedDb.removeSubLevels(this.getEntityUuids());
    return Promise.resolve();
  }
}
