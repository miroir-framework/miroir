import { EntityDefinition, MetaEntity } from '../../../0_interfaces/1_core/EntityDefinition.js';
import { EntityInstance, EntityInstanceCollection } from '../../../0_interfaces/1_core/Instance.js';
import { ModelReplayableUpdate, WrappedModelEntityUpdateWithCUDUpdate } from '../../../0_interfaces/2_domain/ModelUpdateInterface.js';
import { MError } from '../../../0_interfaces/3_controllers/ErrorLogServiceInterface.js';
import { CRUDActionName, DomainModelInitAction, DomainModelReplayableAction, DomainModelResetAction } from '../../2_domain/DomainControllerInterface.js';

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
  instances?: EntityInstanceCollection[]
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
  handleNetworkRemoteStoreCRUDAction(action:RemoteStoreCRUDAction):Promise<RestClientCallReturnType>;
  handleNetworkRemoteStoreModelAction(action:RemoteStoreModelAction):Promise<RestClientCallReturnType>;
}

export default {}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteDataStoreInterface {
  handleRemoteStoreCRUDAction(action:RemoteStoreCRUDAction):Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelAction(action:RemoteStoreModelAction):Promise<RemoteStoreCRUDActionReturnType>;
}


export interface DataStoreInterface {
  start():Promise<void>;

  dropModelAndData():Promise<void>;
  initModel():Promise<void>;
  open();
  close();

  clear();
 
  
  getEntities():string[]; //TODO: remove!
  existsEntity(entityUuid:string):boolean;
  createEntity(entity:MetaEntity, entityDefinition: EntityDefinition);
  dropEntity(parentUuid:string);
  dropEntities(parentUuid:string[]);
  renameEntity(update: WrappedModelEntityUpdateWithCUDUpdate);

  getInstances(parentUuid:string):Promise<EntityInstance[]>;

  getState():Promise<{[uuid:string]:EntityInstance[]}>;
  getDataInstance(parentUuid:string,uuid:string):Promise<EntityInstance>;
  getDataInstances(parentUuid:string):Promise<EntityInstance[]>;
  upsertDataInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteDataInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteDataInstance(parentUuid:string, instance:EntityInstance):Promise<any>;

  getModelInstance(parentUuid:string,uuid:string):Promise<EntityInstance>;
  getModelInstances(parentUuid:string):Promise<EntityInstance[]>;
  upsertModelInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteModelInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteModelInstance(parentUuid:string, instance:EntityInstance):Promise<any>;

  // applyModelEntityUpdates(updates:ModelEntityUpdateWithCUDUpdate[]);
  applyModelEntityUpdate(update:ModelReplayableUpdate);
}