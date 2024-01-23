import { Uuid } from '../1_core/EntityDefinition.js';

import { MiroirApplicationModel } from '../1_core/Model.js';
import { ModelReplayableUpdate, WrappedTransactionalEntityUpdateWithCUDUpdate } from '../2_domain/ModelUpdateInterface.js';
import { Application } from '../1_core/Application.js';
import { DataStoreApplicationType } from '../3_controllers/ApplicationControllerInterface.js';
import {
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionReturnType,
  ActionVoidReturnType,
  ApplicationSection,
  Entity,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  StoreAction,
  StoreSectionConfiguration,
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";


// ###########################################################################################
// Abstract store interfaces
export interface AbstractStoreInterface {
  getStoreName(): string;
  open():Promise<ActionVoidReturnType>;
  close():Promise<ActionVoidReturnType>;
}

// ###########################################################################################
// Abstract store interfaces
export interface AdminStoreInterface extends AbstractStoreInterface {
  createStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType>;
  deleteStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType>;
}

// ###########################################################################################
// Abstract store interfaces
export interface AbstractStoreSectionInterface extends AbstractStoreInterface {
  bootFromPersistedState(
    entities : Entity[],
    entityDefinitions : EntityDefinition[],
  ):Promise<ActionVoidReturnType>;
  getEntityUuids():string[];
  clear():Promise<ActionVoidReturnType>;
}


// ###########################################################################################
export interface StorageSpaceHandlerInterface {
  dropStorageSpaceForInstancesOfEntity(
    entityUuid:Uuid,
  ): Promise<ActionVoidReturnType>;

  createStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionVoidReturnType>;

  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionVoidReturnType>;
}

// ###########################################################################################
export interface AbstractInstanceStoreSectionInterface {
  getInstance(parentUuid: string, uuid: string): Promise<ActionEntityInstanceReturnType>;
  // getInstances(parentUuid: string): Promise<EntityInstance[]>;
  getInstances(parentUuid: string): Promise<ActionEntityInstanceCollectionReturnType>;
  upsertInstance(parentUuid:string, instance:EntityInstance):Promise<ActionVoidReturnType>;
  deleteInstances(parentUuid:string, instances:EntityInstance[]):Promise<ActionVoidReturnType>;
  deleteInstance(parentUuid:string, instance:EntityInstance):Promise<ActionVoidReturnType>;
}

// ###########################################################################################
export interface AbstractEntityStoreSectionInterface {
  existsEntity(entityUuid:string):boolean;

  createEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionReturnType>;
  renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate): Promise<ActionReturnType>;
  dropEntity(parentUuid:string): Promise<ActionReturnType>;
  dropEntities(parentUuid:string[]): Promise<ActionReturnType>;
}

// ###############################################################################################################
// Data and Model sections
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export interface StoreModelSectionInterface extends AbstractStoreSectionInterface, StorageSpaceHandlerInterface, AbstractInstanceStoreSectionInterface, AbstractEntityStoreSectionInterface {
  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
}

export interface StoreDataSectionInterface extends AbstractStoreSectionInterface, StorageSpaceHandlerInterface, AbstractInstanceStoreSectionInterface {
  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
}


// ###############################################################################################################
export type DataOrModelStoreInterface = StoreDataSectionInterface | StoreModelSectionInterface;

// ###############################################################################################################
export type StoreSectionFactory = (
  section:ApplicationSection,
  config: StoreSectionConfiguration,
  dataStore?: StoreDataSectionInterface,
)=>Promise<DataOrModelStoreInterface>;

export type StoreSectionFactoryRegister = Map<string,StoreSectionFactory>;

// ###############################################################################################################
export type AdminStoreFactory = (
  config: StoreSectionConfiguration,
)=>Promise<AdminStoreInterface>;

export type AdminStoreFactoryRegister = Map<string,AdminStoreFactory>;

export interface InitApplicationParameters {
  metaModel:MiroirApplicationModel, 
  dataStoreType: DataStoreApplicationType,
  application: Application,
  applicationDeploymentConfiguration: EntityInstance,
  applicationModelBranch: EntityInstance,
  applicationVersion: EntityInstance,
  applicationStoreBasedConfiguration: EntityInstance,
}

// ###############################################################################################################
// store Controller
// TODO: remove AdminStoreInterface?
export interface StoreControllerInterface extends AdminStoreInterface, AbstractStoreSectionInterface, AbstractEntityStoreSectionInterface /**, AbstractInstanceStoreSectionInterface */ {
  initApplication(
    metaModel:MiroirApplicationModel, 
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeploymentConfiguration: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<ActionReturnType>;

  createStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType>;
  deleteStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType>;

  createModelStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionVoidReturnType>;

  createDataStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionVoidReturnType>;

  clearDataInstances():Promise<ActionVoidReturnType>;

  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
  getModelState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
  getDataState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!

  // instance interface differs from the one in AbstractInstanceStoreSectionInterface: it has an ApplicationSection as first parameter
  getInstance(section: ApplicationSection, parentUuid:string, uuid: Uuid):Promise<ActionReturnType>;
  // getInstances(section: ApplicationSection, parentUuid:string):Promise<EntityInstanceCollection | undefined>;
  getInstances(section: ApplicationSection, parentUuid:string):Promise<ActionEntityInstanceCollectionReturnType>;
  upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<ActionVoidReturnType>;
  deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<ActionVoidReturnType>;
  deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<ActionVoidReturnType>;

  // handleAction(storeAction: StoreAction): Promise<any>;

  applyModelEntityUpdate(update:ModelReplayableUpdate):Promise<ActionReturnType>;
}