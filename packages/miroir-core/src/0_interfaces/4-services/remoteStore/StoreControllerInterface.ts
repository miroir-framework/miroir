import { EntityDefinition, MetaEntity, Uuid } from '../../../0_interfaces/1_core/EntityDefinition.js';
import { ApplicationSection, EntityInstance, EntityInstanceCollection } from '../../../0_interfaces/1_core/Instance.js';
import { MiroirMetaModel } from '../../../0_interfaces/1_core/Model.js';
import { ModelReplayableUpdate, WrappedTransactionalEntityUpdateWithCUDUpdate } from '../../../0_interfaces/2_domain/ModelUpdateInterface.js';
import { DataStoreApplicationType } from '../../../3_controllers/ModelInitializer.js';
import { Application } from '../../1_core/Application.js';


export interface AbstractStoreInterface {
  connect():Promise<void>;
  close();
  bootFromPersistedState(
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ):Promise<void>;
  createStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;
}

export interface ModelStoreInterface extends AbstractStoreInterface {

  getEntities():string[]; //TODO: remove!
  existsEntity(entityUuid:string):boolean;

  createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;
  renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate): Promise<void>;
  dropEntity(parentUuid:string): Promise<void>;
  dropEntities(parentUuid:string[]): Promise<void>;

  dropModelAndData(
    metaModel:MiroirMetaModel,
  ):Promise<void>;

  getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined>;
  getInstances(parentUuid: string): Promise<EntityInstance[]>;
  upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
}

export interface DataStoreInterface extends AbstractStoreInterface{

  dropStorageSpaceForInstancesOfEntity(
    entityUuid:Uuid,
  ): Promise<void>;

  renameStorageSpaceForInstancesOfEntity(
    oldName: string,
    newName: string,
    entity: MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;

  getEntityNames():string[]; //TODO: remove!
  getEntityUuids():string[]; //TODO: remove!
  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // used only for testing purposes!
  getInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined>;
  getInstances(parentUuid: string): Promise<EntityInstance[]>;
  upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteInstance(parentUuid:string, instance:EntityInstance):Promise<any>;

  dropData(
    // metaModel:MiroirMetaModel
  ):Promise<void>;
}

export interface StoreControllerInterface extends AbstractStoreInterface{
  open();//?
  // close();

  initApplication(
    metaModel:MiroirMetaModel, 
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeployment: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<void>;

  getState():Promise<{[uuid:string]:EntityInstanceCollection}>;   // From DataStoreControllerInterface used only for testing purposes!
  getEntities():string[]; // From ModelStoreControllerInterface  TODO: remove!

  existsEntity(entityUuid:string):boolean;
  createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;
  renameEntity(update: WrappedTransactionalEntityUpdateWithCUDUpdate): Promise<void>;
  dropEntity(parentUuid:string): Promise<void>;
  dropEntities(parentUuid:string[]): Promise<void>;

  dropModelAndData(
    metaModel:MiroirMetaModel,
  ):Promise<void>;

  clear(metaModel: MiroirMetaModel): Promise<void>;
  getInstances(section: ApplicationSection, parentUuid:string):Promise<EntityInstanceCollection | undefined>;
  upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<any>;


  applyModelEntityUpdate(update:ModelReplayableUpdate);
}