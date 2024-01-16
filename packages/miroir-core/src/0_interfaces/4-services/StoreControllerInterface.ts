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
  open():Promise<void>;
  close():Promise<void>;
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
  getStoreName(): string;
  open():Promise<void>;
  close():Promise<void>;
  bootFromPersistedState(
    entities : Entity[],
    entityDefinitions : EntityDefinition[],
  ):Promise<void>;
  getEntityUuids():string[];
  clear():Promise<void>;
}


// ###########################################################################################
export interface StorageSpaceHandlerInterface {
  dropStorageSpaceForInstancesOfEntity(
    entityUuid:Uuid,
  ): Promise<void>;

  createStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;

  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: Entity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;
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
  ): Promise<void>;
  renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate): Promise<void>;
  dropEntity(parentUuid:string): Promise<void>;
  dropEntities(parentUuid:string[]): Promise<void>;
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
  ):Promise<void>;

  createStore(config: StoreSectionConfiguration): Promise<ActionReturnType>;
  deleteStore(config: StoreSectionConfiguration): Promise<ActionReturnType>;

  createModelStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;

  createDataStorageSpaceForInstancesOfEntity(
    entity:Entity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;

  clearDataInstances():Promise<void>;

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

  applyModelEntityUpdate(update:ModelReplayableUpdate):Promise<void>;
}