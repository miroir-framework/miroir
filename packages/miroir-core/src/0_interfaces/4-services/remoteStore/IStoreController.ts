import { EntityDefinition, MetaEntity, Uuid } from '../../1_core/EntityDefinition.js';
import { ApplicationSection, EntityInstance, EntityInstanceCollection } from '../../1_core/Instance.js';
import { MiroirApplicationModel } from '../../1_core/Model.js';
import { ModelReplayableUpdate, WrappedTransactionalEntityUpdateWithCUDUpdate } from '../../2_domain/ModelUpdateInterface.js';
import { Application } from '../../1_core/Application.js';
import { DataStoreApplicationType } from '../../3_controllers/ApplicationControllerInterface.js';

// ###########################################################################################
// Abstract store interfaces
export interface IAbstractStore {
  open():Promise<void>;
  close():Promise<void>;
  bootFromPersistedState(
    entities : MetaEntity[],
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
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;

  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;
}

// ###########################################################################################
export interface IAbstractInstanceStore {
  getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined>;
  getInstances(parentUuid: string): Promise<EntityInstance[]>;
  upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
}

// ###########################################################################################
export interface IAbstractEntityStore {
  existsEntity(entityUuid:string):boolean;

  createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;
  renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate): Promise<void>;
  dropEntity(parentUuid:string): Promise<void>;
  dropEntities(parentUuid:string[]): Promise<void>;
}

// ###############################################################################################################
// Data and Model sections
export interface IModelSectionStore extends IAbstractStore, IStorageSpaceHandler, IAbstractInstanceStore, IAbstractEntityStore {
}

export interface IDataSectionStore extends IAbstractStore, IStorageSpaceHandler, IAbstractInstanceStore {
  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
}

// ###############################################################################################################
// store Controller
export interface IStoreController extends IAbstractStore, IAbstractEntityStore {
  initApplication(
    metaModel:MiroirApplicationModel, 
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeployment: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<void>;

  createModelStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;

  createDataStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;

  clearDataInstances():Promise<void>;

  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // From DataStoreControllerInterface used only for testing purposes!
  getInstances(section: ApplicationSection, parentUuid:string):Promise<EntityInstanceCollection | undefined>;
  upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<any>;


  applyModelEntityUpdate(update:ModelReplayableUpdate):Promise<void>;
}