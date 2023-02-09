import { Instance } from '../../../0_interfaces/1_core/Instance.js';
import { EntityDefinition } from '../../1_core/EntityDefinition.js';
import { StoreReturnType } from '../localStore/LocalStoreInterface.js';
// import { EntityDefinition } from 'src/0_interfaces/1_core/EntityDefinition.js';
// import { StoreReturnType } from 'src/0_interfaces/4-services/localStore/LocalStoreInterface';

export const networkCRUDActionNamesObject = {
  'create': 'create',
  'read': 'read',
  'update': 'update',
  'delete': 'delete',
}
export type NetworkCRUDActionName = keyof typeof networkCRUDActionNamesObject;
export const networkCRUDActionNamesArray:NetworkCRUDActionName[] = Object.keys(networkCRUDActionNamesObject) as NetworkCRUDActionName[];

export interface NetworkCRUDAction {
  actionName: NetworkCRUDActionName;
  entityName: string;
  uuid?:string;
  objects?:Instance[];
}

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

export interface RemoteStoreNetworkClientInterface extends RestClientInterface  {
  handleNetworkAction(networkAction:NetworkCRUDAction):Promise<RestClientCallReturnType>; //TODO: return type must be independent of actually called client
}

export default {}

export interface EntityDefinitionRemoteDataStoreInputActionsInterface {
  // fetchEntityDefinitionFromRemoteDataStore(entityName:string):Promise<EntityDefinition>;
  // fetchEntityDefinitionsFromRemoteDataStore():Promise<EntityDefinition[]>;
  // fetchAllEntityDefinitionsFromRemoteDataStore():Promise<StoreReturnType>;
  handleRemoteCRUDAction(action:NetworkCRUDAction):Promise<StoreReturnType>;
}

export interface InstanceRemoteDataStoreInputActionsI {
  // fetchFromApiAndReplaceInstancesForEntity(entityName:string):void;
  fetchInstancesForEntityListFromRemoteDatastore(entities:EntityDefinition[]):Promise<StoreReturnType>;
}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteDataStoreInterface extends 
  EntityDefinitionRemoteDataStoreInputActionsInterface,
  InstanceRemoteDataStoreInputActionsI
{
  // constructor
  // run(): void;
  // getInnerStore(): any; // TODO: local store should not expose its implementation!!
}
