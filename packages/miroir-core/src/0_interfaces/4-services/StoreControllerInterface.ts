import { Uuid } from '../1_core/EntityDefinition.js';

import { MiroirApplicationModel } from '../1_core/Model.js';
import { ModelReplayableUpdate, WrappedTransactionalEntityUpdateWithCUDUpdate } from '../2_domain/ModelUpdateInterface.js';
import { Application } from '../1_core/Application.js';
import { DataStoreApplicationType } from '../3_controllers/ApplicationControllerInterface.js';
import {
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
  // getStoreName(): string;
  createStore():Promise<void>;
  deleteStore():Promise<void>;
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
export interface IStorageSpaceHandler {
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
export interface IAbstractInstanceStoreSection {
  getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined>;
  getInstances(parentUuid: string): Promise<EntityInstance[]>;
  upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
}

// ###########################################################################################
export interface IAbstractEntityStoreSection {
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
export interface IModelStoreSection extends AbstractStoreSectionInterface, IStorageSpaceHandler, IAbstractInstanceStoreSection, IAbstractEntityStoreSection {
  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
}

export interface IDataStoreSection extends AbstractStoreSectionInterface, IStorageSpaceHandler, IAbstractInstanceStoreSection {
  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
}


// ###############################################################################################################
export type IDataOrModelStore = IDataStoreSection | IModelStoreSection;

// ###############################################################################################################
export type StoreSectionFactory = (
  section:ApplicationSection,
  config: StoreSectionConfiguration,
  dataStore?: IDataStoreSection,
)=>Promise<IDataOrModelStore>;

export type StoreSectionFactoryRegister = Map<string,StoreSectionFactory>;


// ###############################################################################################################
// store Controller
export interface IStoreController extends AbstractStoreSectionInterface, IAbstractEntityStoreSection /**, IAbstractInstanceStoreSection */ {
  initApplication(
    metaModel:MiroirApplicationModel, 
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeploymentConfiguration: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<void>;

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

  // instance interface differs from the one in IAbstractInstanceStoreSection: it has an ApplicationSection as first parameter
  getInstance(section: ApplicationSection, parentUuid:string, uuid: Uuid):Promise<EntityInstance | undefined>;
  getInstances(section: ApplicationSection, parentUuid:string):Promise<EntityInstanceCollection | undefined>;
  upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<any>;

  // handleAction(storeAction: StoreAction): Promise<any>;

  applyModelEntityUpdate(update:ModelReplayableUpdate):Promise<void>;
}