import { MetaEntity } from "../../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceCollection, EntityInstance, EntityDefinition, ActionReturnType, ActionEntityInstanceCollectionReturnType } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { StoreDataSectionInterface } from "../../0_interfaces/4-services/StoreControllerInterface.js";

export class ErrorDataStore implements StoreDataSectionInterface {
  constructor() {}
  getStoreName(): string {
    throw new Error("Method not implemented.");
  }
  open(): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  connect(): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  close():Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  clear(): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  getEntityUuids(): string[] {
    throw new Error("Method not implemented.");
  }
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    throw new Error("Method not implemented.");
  }
  getInstance(parentUuid: string, uuid: string): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  getInstances(parentUuid: string): Promise<ActionEntityInstanceCollectionReturnType> {
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
}
