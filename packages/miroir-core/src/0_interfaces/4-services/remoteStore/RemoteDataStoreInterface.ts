import { MError } from '../../../0_interfaces/3_controllers/ErrorLogServiceInterface.js';
import { Instance, InstanceCollection } from '../../../0_interfaces/1_core/Instance.js';

export const RemoteStoreActionNamesObject = {
  'create': 'create',
  'read': 'read',
  'update': 'update',
  'delete': 'delete',
}
export type RemoteStoreActionName = keyof typeof RemoteStoreActionNamesObject;
export const RemoteStoreActionNamesArray:RemoteStoreActionName[] = Object.keys(RemoteStoreActionNamesObject) as RemoteStoreActionName[];

export interface RemoteStoreAction {
  actionName: RemoteStoreActionName;
  entityName: string;
  uuid?:string;
  objects?:Instance[];
}

export interface RemoteStoreActionReturnType {
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
  // dtc();
}

export default {}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteDataStoreInterface {
  handleRemoteStoreAction(action:RemoteStoreAction):Promise<RemoteStoreActionReturnType>;
  // constructor
  // run(): void;
  // getInnerStore(): any; // TODO: local store should not expose its implementation!!
}
