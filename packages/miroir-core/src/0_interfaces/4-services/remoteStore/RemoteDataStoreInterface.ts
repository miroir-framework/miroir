import { Instance, InstanceCollection } from '../../../0_interfaces/1_core/Instance.js';
import { MError } from '../../../0_interfaces/3_controllers/ErrorLogServiceInterface.js';
import { CRUDActionName, DomainModelAction } from '../../2_domain/DomainControllerInterface.js';

export interface RemoteStoreCRUDAction {
  actionName: CRUDActionName;
  entityName: string;
  uuid?:string;
  objects?:Instance[];
}

export type RemoteStoreModelAction = DomainModelAction;
// export interface RemoteStoreModelAction {
//   actionName: ModelActionName;
//   actions: 
// }

export type RemoteStoreAction = RemoteStoreCRUDAction | RemoteStoreModelAction;
// export interface RemoteStoreAction {
//   actionName: RemoteStoreActionName;
//   entityName?: string;
//   uuid?:string;
//   objects?:Instance[];
// }

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
}

export default {}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteDataStoreInterface {
  handleRemoteStoreCRUDAction(action:RemoteStoreCRUDAction):Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelAction(action:RemoteStoreModelAction):Promise<RemoteStoreCRUDActionReturnType>;
  // constructor
  // run(): void;
  // getInnerStore(): any; // TODO: local store should not expose its implementation!!
}



export interface DataStoreInterface {
  init():Promise<void>;
  getEntities():string[]; //TODO: remove!
  dropEntity(entityName:string);
  dropEntities(entityNames:string[]);

  getInstances(entityName:string):Promise<Instance[]>;
  upsertInstance(entityName:string, instance:Instance):Promise<any>;
  deleteInstances(entityName:string, instances:Instance[]):Promise<any>;

}