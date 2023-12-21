import { MetaEntity } from "../../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceCollection, EntityInstance, EntityDefinition } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { WrappedTransactionalEntityUpdateWithCUDUpdate } from "../../0_interfaces/2_domain/ModelUpdateInterface.js";
import { IModelStoreSection } from "../../0_interfaces/4-services/StoreControllerInterface.js";

export class ErrorModelStore implements IModelStoreSection {
  constructor() {}
  
  getStoreName(): string {
    throw new Error("Method not implemented.");
  }
  open(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  close():Promise<void> {
    throw new Error("Method not implemented.");
  }
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  createStorageSpaceForInstancesOfEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    throw new Error("Method not implemented.");
  }
  dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  renameStorageSpaceForInstancesOfEntity(oldName: string, newName: string, entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    throw new Error("Method not implemented.");
  }
  clear(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getEntityUuids(): string[] {
    throw new Error("Method not implemented.");
  }
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    throw new Error("Method not implemented.");
  }
  existsEntity(entityUuid: string): boolean {
    throw new Error("Method not implemented.");
  }
  createEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<void> {
    throw new Error("Method not implemented.");
  }
  renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate): Promise<void> {
    throw new Error("Method not implemented.");
  }
  dropEntity(parentUuid: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  dropEntities(parentUuid: string[]): Promise<void> {
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
}
