import { EntityInstance, EntityInstanceCollection } from '../../../0_interfaces/1_core/Instance.js';
import { ModelReplayableUpdate } from '../../../0_interfaces/2_domain/ModelUpdateInterface.js';
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

  getdb():any;
  dropModel():Promise<void>;
  initModel():Promise<void>;
  open();
  close();

  clear();
 
  addConcepts(conceptsNames:string[]);
  
  getEntityDefinitions():string[]; //TODO: remove!
  getEntities():string[]; //TODO: remove!
  dropEntity(parentUuid:string);
  dropEntities(parentUuid:string[]);

  getInstances(parentUuid:string):Promise<EntityInstance[]>;
  upsertInstance(parentUuid:string, instance:EntityInstance):Promise<any>;
  deleteInstances(parentUuid:string, instances:EntityInstance[]):Promise<any>;
  deleteInstance(parentUuid:string, instance:EntityInstance):Promise<any>;

  // applyModelEntityUpdates(updates:ModelEntityUpdateWithCUDUpdate[]);
  applyModelEntityUpdate(update:ModelReplayableUpdate);
}