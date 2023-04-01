import { ModelStructureUpdate } from '../../../0_interfaces/2_domain/ModelUpdateInterface.js';
import { Instance, InstanceCollection } from '../../../0_interfaces/1_core/Instance.js';
import { MError } from '../../../0_interfaces/3_controllers/ErrorLogServiceInterface.js';
import { CRUDActionName, DomainModelStructureUpdateAction } from '../../2_domain/DomainControllerInterface.js';

export interface RemoteStoreCRUDAction {
  actionName: CRUDActionName;
  entityName?: string; //redundant with object list
  entityUuid?: string; //redundant with object list
  uuid?:string; //redundant with object list
  objects?:Instance[]; 
}

// export type RemoteStoreModelAction = DomainModelAction;
export type RemoteStoreModelAction = DomainModelStructureUpdateAction;

export type RemoteStoreAction = RemoteStoreCRUDAction | RemoteStoreModelAction;

export interface RemoteStoreCRUDActionReturnType {
  status:'ok'|'error',
  errorMessage?:string, 
  error?:MError,
  instances?: InstanceCollection[]
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
  init():Promise<void>;

  getdb():any;
  dropModel();
  open();
  close();

  clear();
 
  addConcepts(conceptsNames:string[]);
  
  getUuidEntities():string[]; //TODO: remove!
  dropUuidEntity(entityUuid:string);
  dropUuidEntities(entityUuid:string[]);

  getInstancesUuid(entityUuid:string):Promise<Instance[]>;
  upsertInstanceUuid(entityUuid:string, instance:Instance):Promise<any>;
  deleteInstancesUuid(entityUuid:string, instances:Instance[]):Promise<any>;
  deleteInstanceUuid(entityUuid:string, instance:Instance):Promise<any>;

  applyModelStructureUpdates(updates:ModelStructureUpdate[]);
}