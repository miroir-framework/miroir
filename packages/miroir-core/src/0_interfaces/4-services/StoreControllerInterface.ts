import { Uuid } from '../1_core/EntityDefinition.js';

import { MiroirApplicationModel } from '../1_core/Model.js';
import { ModelReplayableUpdate, WrappedTransactionalEntityUpdateWithCUDUpdate } from '../2_domain/ModelUpdateInterface.js';
import { Application } from '../1_core/Application.js';
import { DataStoreApplicationType } from '../3_controllers/ApplicationControllerInterface.js';
import {
  ActionReturnType,
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
  open():Promise<ActionReturnType>;
  close():Promise<ActionReturnType>;
}

// ###########################################################################################
// Abstract store interfaces
export interface AdminStoreInterface extends AbstractStoreInterface {
  createStore(config: StoreSectionConfiguration): Promise<ActionReturnType>;
  deleteStore(config: StoreSectionConfiguration): Promise<ActionReturnType>;
}

// ###########################################################################################
// Abstract store interfaces
export interface AbstractStoreSectionInterface extends AbstractStoreInterface {
  bootFromPersistedState(
    entities : Entity[],
    entityDefinitions : EntityDefinition[],
  ):Promise<ActionReturnType>;
  getEntityUuids():string[];
  clear():Promise<ActionReturnType>;
}


// ###########################################################################################
export interface StorageSpaceHandlerInterface {
  dropStorageSpaceForInstancesOfEntity(
    entityUuid:Uuid,
  ): Promise<ActionReturnType>;

  createStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionReturnType>;

  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionReturnType>;
}

// ###########################################################################################
export interface AbstractInstanceStoreSectionInterface {
  getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined>;
  getInstances(parentUuid: string): Promise<EntityInstance[]>;
  upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
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

  createStore(config: StoreSectionConfiguration): Promise<ActionReturnType>;
  deleteStore(config: StoreSectionConfiguration): Promise<ActionReturnType>;

  createModelStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionReturnType>;

  createDataStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<ActionReturnType>;

  clearDataInstances():Promise<ActionReturnType>;

  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
  getModelState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
  getDataState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!

  // instance interface differs from the one in AbstractInstanceStoreSectionInterface: it has an ApplicationSection as first parameter
  getInstance(section: ApplicationSection, parentUuid:string, uuid: Uuid):Promise<EntityInstance | undefined>;
  getInstances(section: ApplicationSection, parentUuid:string):Promise<EntityInstanceCollection | undefined>;
  upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<any>;

  // handleAction(storeAction: StoreAction): Promise<any>;

  applyModelEntityUpdate(update:ModelReplayableUpdate):Promise<ActionReturnType>;
}