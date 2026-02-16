import { MetaEntity } from "../../0_interfaces/1_core/EntityDefinition";
import {
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  Action2EntityInstanceCollection,
  Action2EntityInstanceSuccess,
  Action2ReturnType,
  Action2VoidReturnType,
} from "../../0_interfaces/2_domain/DomainElement";
import { PersistenceStoreModelSectionInterface } from "../../0_interfaces/4-services/PersistenceStoreControllerInterface";

export class ErrorModelStore implements PersistenceStoreModelSectionInterface {
  constructor() {}

  getStoreName(): string {
    throw new Error("Method not implemented.");
  }
  open(): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  close(): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  createStorageSpaceForInstancesOfEntity(
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  clear(): Promise<Action2VoidReturnType> {
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
  createEntity(entity: MetaEntity, entityDefinition: EntityDefinition): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  createEntities(entities:{entity: MetaEntity, entityDefinition: EntityDefinition}[]): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented");
  }

  dropEntity(parentUuid: string): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  dropEntities(parentUuid: string[]): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  getInstance(parentUuid: string, uuid: string): Promise<Action2EntityInstanceSuccess> {
    throw new Error("Method not implemented.");
  }
  getInstances(parentUuid: string): Promise<Action2EntityInstanceCollection> {
    throw new Error("Method not implemented.");
  }
  handleQueryTemplateActionForServerONLY(query: RunBoxedQueryTemplateAction): Promise<Action2ReturnType> {
    throw new Error("Method not implemented.");
  }
  handleBoxedQueryAction(query: RunBoxedQueryAction): Promise<Action2ReturnType> {
    throw new Error("Method not implemented.");
  }
  upsertInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  deleteInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
}
