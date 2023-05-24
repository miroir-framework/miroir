import { EntityDefinition, MetaEntity } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstance, EntityInstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { DataStoreInterface } from "../0_interfaces/4-services/remoteStore/StoreControllerInterface.js";

export class ErrorDataStore implements DataStoreInterface {
  constructor() {};

  dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getEntityNames(): string[] {
    throw new Error("Method not implemented.");
  }
  getEntityUuids(): string[] {
    throw new Error("Method not implemented.");
  }
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection; }> {
    throw new Error("Method not implemented.");
  }
  getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined> {
    throw new Error("Method not implemented.");
  }
  getInstances(parentUuid: string): Promise<EntityInstance[]> {
    throw new Error("Method not implemented.");
  }
  upsertInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    throw new Error("Method not implemented.");
  }
  deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<any> {
    throw new Error("Method not implemented.");
  }
  deleteInstance(parentUuid: string, instance: EntityInstance): Promise<any> {
    throw new Error("Method not implemented.");
  }
  dropData(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  connect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  close() {
    throw new Error("Method not implemented.");
  }
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
