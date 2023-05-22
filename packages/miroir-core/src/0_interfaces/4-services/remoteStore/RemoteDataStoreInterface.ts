import { MiroirMetaModel } from '../../../0_interfaces/1_core/Model.js';
import { EntityDefinition, MetaEntity, Uuid } from '../../../0_interfaces/1_core/EntityDefinition.js';
import { ApplicationSection, EntityInstance, EntityInstanceCollection } from '../../../0_interfaces/1_core/Instance.js';
import { ModelReplayableUpdate, WrappedModelEntityUpdateWithCUDUpdate } from '../../../0_interfaces/2_domain/ModelUpdateInterface.js';
import { MError } from '../../../0_interfaces/3_controllers/ErrorLogServiceInterface.js';
import { CRUDActionName, DomainModelInitAction, DomainModelReplayableAction, DomainModelResetAction } from '../../2_domain/DomainControllerInterface.js';
import { DataStoreApplicationType } from '../../../3_controllers/ModelInitializer.js';
import { Application } from '../../1_core/Application.js';

export interface RemoteStoreCRUDAction {
  actionType:'RemoteStoreCRUDAction';
  actionName: CRUDActionName;
  parentName?: string; //redundant with object list
  parentUuid?: string; //redundant with object list
  uuid?:string; //redundant with object list
  objects?:EntityInstance[]; 
}

// export type RemoteStoreModelAction = DomainModelAction;
// export type RemoteStoreModelAction = DomainModelEntityUpdateAction;
export type RemoteStoreModelAction = DomainModelReplayableAction | DomainModelResetAction | DomainModelInitAction;

export type RemoteStoreAction = RemoteStoreCRUDAction | RemoteStoreModelAction;

export interface RemoteStoreCRUDActionReturnType {
  status:'ok'|'error',
  errorMessage?:string, 
  error?:MError,
  // instances: EntityInstanceCollection[]
  instanceCollection: EntityInstanceCollection
};

export interface RestClientCallReturnType {
  status: number;
  data: any;
  // headers: any;
  headers: Headers;
  url: string;
}

export interface RestClientInterface {
  get(endpoint:string, customConfig?:any): Promise<RestClientCallReturnType>;
  post(endpoint:string, body:any, customConfig?:any): Promise<RestClientCallReturnType>;
  put(endpoint:string, body:any, customConfig?:any): Promise<RestClientCallReturnType>;
  delete(endpoint:string, body:any, customConfig?:any): Promise<RestClientCallReturnType>;
}

/**
 * Decorator for RestClientInterface, should eventually replace it entirely.
 * Should allow to hide implementation details, such as the use of REST and/or GraphQL
 */
export interface RemoteStoreNetworkClientInterface {
  handleNetworkAction(networkAction:RemoteStoreAction):Promise<RestClientCallReturnType>; //TODO: return type must be independent of actually called client
  // handleNetworkRemoteStoreCRUDAction(action:RemoteStoreCRUDAction):Promise<RestClientCallReturnType>;
  // handleNetworkRemoteStoreModelAction(action:RemoteStoreModelAction):Promise<RestClientCallReturnType>;
  handleNetworkRemoteStoreCRUDActionWithDeployment(deploymentUuid:string, section:ApplicationSection, action:RemoteStoreCRUDAction):Promise<RestClientCallReturnType>;
  handleNetworkRemoteStoreModelActionWithDeployment(deploymentUuid:string, action:RemoteStoreModelAction):Promise<RestClientCallReturnType>;
}

export default {}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteDataStoreInterface {
  // handleRemoteStoreCRUDAction(action:RemoteStoreCRUDAction):Promise<RemoteStoreCRUDActionReturnType>;
  // handleRemoteStoreModelAction(action:RemoteStoreModelAction):Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreCRUDActionWithDeployment(deploymentUuid:string, section:ApplicationSection, action:RemoteStoreCRUDAction):Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelActionWithDeployment(deploymentUuid:string, action:RemoteStoreModelAction):Promise<RemoteStoreCRUDActionReturnType>;
}

export interface ModelStoreInterface {
  close();

  connect():Promise<void>;
  bootFromPersistedState(
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ):Promise<void>;

  getEntities():string[]; //TODO: remove!
  existsEntity(entityUuid:string):boolean;

  createStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;

  createEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;
  renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate): Promise<void>;
  dropEntity(parentUuid:string): Promise<void>;
  dropEntities(parentUuid:string[]): Promise<void>;

  dropModelAndData(
    metaModel:MiroirMetaModel,
  ):Promise<void>;

  getModelInstances(parentUuid: string): Promise<EntityInstance[]>;

  upsertModelInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteModelInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteModelInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
}

export interface DataStoreInterface {

  connect():Promise<void>;

  bootFromPersistedState(
    entities : MetaEntity[],
    entityDefinitions : EntityDefinition[],
  ): Promise<void>;

  createStorageSpaceForInstancesOfEntity(
    entity:MetaEntity,
    entityDefinition: EntityDefinition,
  ): Promise<void>;

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
  getDataInstance(parentUuid: string, uuid: string): Promise<EntityInstance | undefined>;
  getDataInstances(parentUuid: string): Promise<EntityInstance[]>;
  upsertDataInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteDataInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteDataInstance(parentUuid:string, instance:EntityInstance):Promise<any>;

  dropData(
    // metaModel:MiroirMetaModel
  ):Promise<void>;

  close();

}

export interface StoreControllerInterface extends ModelStoreInterface, DataStoreInterface{
  open();
  close();

  initApplication(
    metaModel:MiroirMetaModel, 
    dataStoreType: DataStoreApplicationType,
    application: Application,
    applicationDeployment: EntityInstance,
    applicationModelBranch: EntityInstance,
    applicationVersion: EntityInstance,
    applicationStoreBasedConfiguration: EntityInstance,
  ):Promise<void>;

  clear(metaModel: MiroirMetaModel): Promise<void>;
  getInstances(section: ApplicationSection, parentUuid:string):Promise<EntityInstanceCollection | undefined>;
  upsertInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstance(section: ApplicationSection, instance:EntityInstance):Promise<any>;
  deleteInstances(section: ApplicationSection, instances:EntityInstance[]):Promise<any>;
  applyModelEntityUpdate(update:ModelReplayableUpdate);
}