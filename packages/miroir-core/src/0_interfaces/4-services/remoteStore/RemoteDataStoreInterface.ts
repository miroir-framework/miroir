import { DomainAction } from '../../../0_interfaces/2_domain/DomainLanguageInterface.js';
import { EntityDefinition } from '../../1_core/EntityDefinition.js';
import { StoreReturnType } from '../localStore/LocalStoreInterface.js';
// import { EntityDefinition } from 'src/0_interfaces/1_core/EntityDefinition.js';
// import { StoreReturnType } from 'src/0_interfaces/4-services/localStore/LocalStoreInterface';

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

export interface RemoteStoreClientInterface extends RestClientInterface  {
  resolveAction(domainAction:DomainAction):Promise<RestClientCallReturnType>; //TODO: return type must be independent of actually called client
}

export default {}

export interface EntityDefinitionRemoteDataStoreInputActionsI {
  // fetchEntityDefinitionFromRemoteDataStore(entityName:string):Promise<EntityDefinition>;
  // fetchEntityDefinitionsFromRemoteDataStore():Promise<EntityDefinition[]>;
  fetchAllEntityDefinitionsFromRemoteDataStore():Promise<StoreReturnType>;
  handleAction(action:DomainAction):Promise<StoreReturnType>;
}

export interface InstanceRemoteDataStoreInputActionsI {
  // fetchFromApiAndReplaceInstancesForEntity(entityName:string):void;
  fetchInstancesForEntityListFromRemoteDatastore(entities:EntityDefinition[]):Promise<StoreReturnType>;
}

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteDataStoreInterface extends 
  EntityDefinitionRemoteDataStoreInputActionsI,
  InstanceRemoteDataStoreInputActionsI
{
  // constructor
  // run(): void;
  // getInnerStore(): any; // TODO: local store should not expose its implementation!!
}
