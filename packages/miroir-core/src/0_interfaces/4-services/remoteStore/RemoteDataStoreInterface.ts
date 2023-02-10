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
}

/**
 * Decorator for RestClientInterface, should eventually replace it entirely.
 * Should allow to hide implementation details, such as the use of REST and/or GraphQL
 */
export interface RemoteStoreNetworkClientInterface extends RestClientInterface  {
  handleNetworkAction(networkAction:RemoteStoreAction):Promise<RestClientCallReturnType>; //TODO: return type must be independent of actually called client
}

export default {}

export interface EntityDefinitionRemoteDataStoreInputActionsInterface {
  // fetchEntityDefinitionFromRemoteDataStore(entityName:string):Promise<EntityDefinition>;
  // fetchEntityDefinitionsFromRemoteDataStore():Promise<EntityDefinition[]>;
  // fetchAllEntityDefinitionsFromRemoteDataStore():Promise<RemoteStoreActionReturnType>;
  // handleRemoteStoreAction(action:RemoteStoreAction):Promise<RemoteStoreActionReturnType>;
}

export interface InstanceRemoteDataStoreInputActionsI {
  // fetchFromApiAndReplaceInstancesForEntity(entityName:string):void;
  // fetchInstancesForEntityListFromRemoteDatastore(entities:EntityDefinition[]):Promise<RemoteStoreActionReturnType>;
}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteDataStoreInterface extends 
  EntityDefinitionRemoteDataStoreInputActionsInterface,
  InstanceRemoteDataStoreInputActionsI
{
  handleRemoteStoreAction(action:RemoteStoreAction):Promise<RemoteStoreActionReturnType>;
  // constructor
  // run(): void;
  // getInnerStore(): any; // TODO: local store should not expose its implementation!!
}
