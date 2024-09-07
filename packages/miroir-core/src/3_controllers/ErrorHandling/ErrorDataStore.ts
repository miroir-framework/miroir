import { MetaEntity } from "../../0_interfaces/1_core/EntityDefinition.js";
import {
  EntityInstanceCollection,
  EntityInstance,
  EntityDefinition,
  ActionReturnType,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionVoidReturnType,
  ApplicationSection,
  QueryTemplateAction,
  QueryAction,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { PersistenceStoreDataSectionInterface } from "../../0_interfaces/4-services/PersistenceStoreControllerInterface.js";

export class ErrorDataStore implements PersistenceStoreDataSectionInterface {
  constructor() {}
  getStoreName(): string {
    throw new Error("Method not implemented.");
  }
  open(): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  connect(): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  close(): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  bootFromPersistedState(entities: MetaEntity[], entityDefinitions: EntityDefinition[]): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  clear(): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  createStorageSpaceForInstancesOfEntity(
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  dropStorageSpaceForInstancesOfEntity(entityUuid: string): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition
  ): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  getEntityUuids(): string[] {
    throw new Error("Method not implemented.");
  }
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection }> {
    throw new Error("Method not implemented.");
  }
  getInstance(parentUuid: string, uuid: string): Promise<ActionEntityInstanceReturnType> {
    throw new Error("Method not implemented.");
  }
  getInstances(parentUuid: string): Promise<ActionEntityInstanceCollectionReturnType> {
    throw new Error("Method not implemented.");
  }
  handleQueryTemplate(query: QueryTemplateAction): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  handleQuery(query: QueryAction): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  upsertInstance(parentUuid: string, instance: EntityInstance): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  deleteInstance(parentUuid: string, instance: EntityInstance): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
}
