import type { ApplicationDeploymentMap } from "../../1_core/Deployment";
import { Uuid } from "../1_core/EntityDefinition";

import {
  ApplicationSection,
  DataStoreType,
  Entity,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  InstanceAction,
  MetaModel,
  ModelAction,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  RunBoxedExtractorAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  SelfApplication,
  StoreSectionConfiguration
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../1_core/Transformer";
import {
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2ReturnType,
  Action2VoidReturnType
} from "../2_domain/DomainElement";
import { DataStoreApplicationType } from "../3_controllers/ApplicationControllerInterface";

export type PersistenceStoreControllerAction =
  | InstanceAction
  | ModelAction
;


// ###########################################################################################
// Abstract store interfaces
export interface PersistenceStoreAbstractInterface {
  getStoreName(): string;
  open():Promise<Action2VoidReturnType>;
  close():Promise<Action2VoidReturnType>;
}

// ###########################################################################################
// Abstract store interfaces
export interface PersistenceStoreAdminSectionInterface extends PersistenceStoreAbstractInterface {
  createStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType>;
  deleteStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType>;
}

// ###########################################################################################
// Abstract store interfaces
export interface PersistenceStoreAbstractSectionInterface extends PersistenceStoreAbstractInterface {
  bootFromPersistedState(
    entities : Entity[],
    entityDefinitions : EntityDefinition[],
  ):Promise<Action2VoidReturnType>;
  getEntityUuids():string[];
  clear():Promise<Action2VoidReturnType>;
}


// ###########################################################################################
export interface StorageSpaceHandlerInterface {
  dropStorageSpaceForInstancesOfEntity(
    entityUuid:Uuid,
  ): Promise<Action2VoidReturnType>;

  createStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<Action2VoidReturnType>;

  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: Entity,
    entityDefinition: EntityDefinition,
  ): Promise<Action2VoidReturnType>;
}

// ###########################################################################################
export interface PersistenceStoreInstanceSectionAbstractInterface
  extends PersistenceStoreAbstractSectionInterface {
  getInstance(parentUuid: string, uuid: string): Promise<Action2EntityInstanceReturnType>;
  getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure>;
  handleBoxedExtractorTemplateActionForServerONLY(
    query: RunBoxedExtractorTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>; // TODO: polymorphize function with return type depending on query type?
  handleQueryTemplateActionForServerONLY(
    query: RunBoxedQueryTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>; // TODO: polymorphize function with return type depending on query type?
  handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
    query: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>; // TODO: polymorphize function with return type depending on query type?
  handleBoxedQueryAction(
    query: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>; // TODO: polymorphize function with return type depending on query type?
  handleBoxedExtractorAction(
    query: RunBoxedExtractorAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>; // TODO: polymorphize function with return type depending on query type?
  upsertInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType>;
  deleteInstances(parentUuid: string, instances: EntityInstance[]): Promise<Action2VoidReturnType>;
  deleteInstance(parentUuid: string, instance: EntityInstance): Promise<Action2VoidReturnType>;
}

// ###########################################################################################
export interface PersistenceStoreEntitySectionAbstractInterface  extends PersistenceStoreAbstractSectionInterface {
  existsEntity(entityUuid:string):boolean;

  createEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<Action2VoidReturnType>;
  createEntities(
    entities: {
      entity:Entity,
      entityDefinition: EntityDefinition,
    }[]
  ): Promise<Action2VoidReturnType>;
  renameEntityClean(update: ModelActionRenameEntity): Promise<Action2VoidReturnType>;
  alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<Action2VoidReturnType>;
  dropEntity(parentUuid:string): Promise<Action2VoidReturnType>;
  dropEntities(parentUuid:string[]): Promise<Action2VoidReturnType>;
}

// ###############################################################################################################
// Data and Model sections
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export interface PersistenceStoreModelSectionInterface
  extends PersistenceStoreAbstractSectionInterface,
    StorageSpaceHandlerInterface,
    PersistenceStoreInstanceSectionAbstractInterface,
    PersistenceStoreEntitySectionAbstractInterface {
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection }>; // used only for testing purposes!
}

export interface PersistenceStoreDataSectionInterface
  extends PersistenceStoreAbstractSectionInterface,
    StorageSpaceHandlerInterface,
    PersistenceStoreInstanceSectionAbstractInterface {
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection }>; // used only for testing purposes!
}


// ###############################################################################################################
export type PersistenceStoreDataOrModelSectionInterface = PersistenceStoreDataSectionInterface | PersistenceStoreModelSectionInterface;

// ###############################################################################################################
export type PersistenceStoreSectionFactory = (
  section:ApplicationSection,
  config: StoreSectionConfiguration,
  dataStore?: PersistenceStoreDataSectionInterface,
)=>Promise<PersistenceStoreDataOrModelSectionInterface>;

export type StoreSectionFactoryRegister = Map<string,PersistenceStoreSectionFactory>;

// ###############################################################################################################
export type PersistenceStoreAdminSectionFactory = (
  config: StoreSectionConfiguration,
)=>Promise<PersistenceStoreAdminSectionInterface>;

export type AdminStoreFactoryRegister = Map<string,PersistenceStoreAdminSectionFactory>;

export interface InitApplicationParameters {
  // TODO: gice actual types to parameters, not just EntityInstance
  metaModel:MetaModel,
  dataStoreType: DataStoreType,
  selfApplication: SelfApplication,
  applicationModelBranch: EntityInstance,
  applicationVersion: EntityInstance,
  // applicationStoreBasedConfiguration: EntityInstance,
}

// ###############################################################################################################
// store Controller
// TODO: remove PersistenceStoreAdminSectionInterface?
export interface PersistenceStoreControllerInterface
  extends PersistenceStoreAbstractSectionInterface,
    PersistenceStoreAdminSectionInterface,
    PersistenceStoreEntitySectionAbstractInterface {
  /**, PersistenceStoreInstanceSectionAbstractInterface */
  //  TODO: remove anything but handleAction from interface!
  initApplication(
    metaModel: MetaModel,
    dataStoreType: DataStoreApplicationType,
    selfApplication: SelfApplication,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance
    // applicationStoreBasedConfiguration: EntityInstance
  ): Promise<Action2ReturnType>;

  createModelStorageSpaceForInstancesOfEntity(
    entity: Entity,
    entityDefinition: EntityDefinition
  ): Promise<Action2VoidReturnType>;

  getModelState(): Promise<{ [uuid: string]: EntityInstanceCollection }>; // used only for testing purposes!
  getDataState(): Promise<{ [uuid: string]: EntityInstanceCollection }>; // used only for testing purposes!

  // same interface as in PersistenceStoreInstanceSectionAbstractInterface; it implies that RunBoxedQueryTemplateOrBoxedExtractorTemplateAction includes applicationSection
  handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
    query: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>;
  handleQueryTemplateActionForServerONLY(
    query: RunBoxedQueryTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>;
  handleBoxedExtractorTemplateActionForServerONLY(
    query: RunBoxedExtractorTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>;
  handleBoxedExtractorAction(
    query: RunBoxedExtractorAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>;
  handleBoxedQueryAction(
    query: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModel?: MiroirModelEnvironment
  ): Promise<Action2ReturnType>;

  getInstance(
    section: ApplicationSection,
    parentUuid: string,
    uuid: Uuid
  ): Promise<Action2EntityInstanceReturnType>;
  getInstances(
    section: ApplicationSection,
    parentUuid: string
  ): Promise<Action2EntityInstanceCollectionOrFailure>;
  upsertInstance(
    section: ApplicationSection,
    instance: EntityInstance
  ): Promise<Action2VoidReturnType>;
  deleteInstance(
    section: ApplicationSection,
    instance: EntityInstance
  ): Promise<Action2VoidReturnType>;
  deleteInstances(
    section: ApplicationSection,
    instance: EntityInstance[]
  ): Promise<Action2VoidReturnType>;

  handleAction(
    storeManagementAction: PersistenceStoreControllerAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Promise<any>;
}