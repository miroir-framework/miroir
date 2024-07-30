import { Uuid } from '../1_core/EntityDefinition.js';

import {
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceReturnType,
  ActionReturnType,
  ActionVoidReturnType,
  Application,
  ApplicationSection,
  Entity,
  EntityDefinition,
  EntityInstance,
  EntityInstanceCollection,
  InstanceAction,
  MetaModel,
  ModelAction,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  QueryAction,
  StoreManagementAction,
  StoreSectionConfiguration
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { DataStoreApplicationType } from '../3_controllers/ApplicationControllerInterface.js';

export type PersistenceStoreControllerAction =
  | InstanceAction
  | ModelAction
;


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
  getInstances(parentUuid: string): Promise<ActionEntityInstanceCollectionReturnType>;
  // handleQuery(query: QueryAction): Promise<ActionReturnType>; // TODO: polymorphize function with return type depending on query type?
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
  ): Promise<ActionVoidReturnType>;
  createEntities(
    entities: {
      entity:Entity,
      entityDefinition: EntityDefinition,
    }[]
  ): Promise<ActionVoidReturnType>;
  renameEntityClean(update: ModelActionRenameEntity): Promise<ActionVoidReturnType>;
  alterEntityAttribute(update: ModelActionAlterEntityAttribute): Promise<ActionVoidReturnType>;
  dropEntity(parentUuid:string): Promise<ActionVoidReturnType>;
  dropEntities(parentUuid:string[]): Promise<ActionVoidReturnType>;
}

// ###############################################################################################################
// Data and Model sections
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
export interface StoreModelSectionInterface
  extends AbstractStoreSectionInterface,
    StorageSpaceHandlerInterface,
    AbstractInstanceStoreSectionInterface,
    AbstractEntityStoreSectionInterface {
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection }>; // used only for testing purposes!
}

export interface StoreDataSectionInterface
  extends AbstractStoreSectionInterface,
    StorageSpaceHandlerInterface,
    AbstractInstanceStoreSectionInterface {
  getState(): Promise<{ [uuid: string]: EntityInstanceCollection }>; // used only for testing purposes!
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
  metaModel:MetaModel, 
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
export interface PersistenceStoreControllerInterface
  extends AbstractStoreSectionInterface,
  AdminStoreInterface,
  AbstractEntityStoreSectionInterface /**, AbstractInstanceStoreSectionInterface */
{

  //  TODO: remove anything but handleAction from interface!
  initApplication(
    metaModel: MetaModel,
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeploymentConfiguration: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance
  ): Promise<ActionReturnType>;

  createModelStorageSpaceForInstancesOfEntity(
    entity: Entity,
    entityDefinition: EntityDefinition
  ): Promise<ActionVoidReturnType>;

  getModelState(): Promise<{ [uuid: string]: EntityInstanceCollection }>; // used only for testing purposes!
  getDataState(): Promise<{ [uuid: string]: EntityInstanceCollection }>; // used only for testing purposes!

  // // instance interface differs from the one in AbstractInstanceStoreSectionInterface: it has an ApplicationSection as first parameter
  getInstance(section: ApplicationSection, parentUuid: string, uuid: Uuid): Promise<ActionEntityInstanceReturnType>;
  getInstances(section: ApplicationSection, parentUuid: string): Promise<ActionEntityInstanceCollectionReturnType>;
  // handleQuery(section: ApplicationSection, query: QueryAction): Promise<ActionReturnType>;
  upsertInstance(section: ApplicationSection, instance: EntityInstance): Promise<ActionVoidReturnType>;
  deleteInstance(section: ApplicationSection, instance: EntityInstance): Promise<ActionVoidReturnType>;
  deleteInstances(section: ApplicationSection, instance: EntityInstance[]): Promise<ActionVoidReturnType>;

  handleAction(storeManagementAction: PersistenceStoreControllerAction): Promise<any>;
}