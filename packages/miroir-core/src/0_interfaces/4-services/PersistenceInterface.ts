import { HttpMethod } from "../1_core/Http";
import {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  EntityInstance,
  EntityInstanceCollection,
  LocalCacheAction,
  PersistenceAction,
  StoreOrBundleAction
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../1_core/Transformer";
import { DomainControllerInterface } from "../2_domain/DomainControllerInterface";
import { Action2ReturnType, type Action2Error } from "../2_domain/DomainElement";
import { MError } from "../3_controllers/ErrorLogServiceInterface";
import { LocalCacheInterface } from "./LocalCacheInterface";
import { PersistenceStoreControllerManagerInterface } from "./PersistenceStoreControllerManagerInterface";


// ################################################################################################
export interface HttpRequestBodyFormat {
  instances?: EntityInstance[];
  crudInstances?: EntityInstance[];
  modelUpdate?: any;
  query?: BoxedQueryTemplateWithExtractorCombinerTransformer | BoxedQueryWithExtractorCombinerTransformer;
  // queryTemplate?: BoxedQueryTemplateWithExtractorCombinerTransformer;
  other?: any;
};

// ################################################################################################
export interface HttpResponseBodyFormat {
  instances: EntityInstance[]
};

// ################################################################################################
export type RestMethodHandler =  (
  useDomainControllerToHandleModelAndInstanceActions: boolean,
  continuationFunction: (response:any) =>(arg0: any) => any,
  response: any,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
  method: HttpMethod, // unused!
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat, // unused!
  params: any,
) => Promise<any>;


// ################################################################################################
export declare type RestServiceHandler = {
  method: HttpMethod,
  url: string,
  handler: RestMethodHandler
};

// ################################################################################################
export interface RestClientInterface {
  get(rawUrl:string, endpoint: string, customConfig?: any): Promise<RestClientCallReturnType>;
  post(rawUrl:string, endpoint: string, body: any, customConfig?: any): Promise<RestClientCallReturnType>;
  put(rawUrl:string, endpoint: string, body: any, customConfig?: any): Promise<RestClientCallReturnType>;
  delete(rawUrl:string, endpoint: string, body: any, customConfig?: any): Promise<RestClientCallReturnType>;
}

// ################################################################################################
export type RestClientCallReturnType = Action2Error | {
  status: number;
  data: any;
  headers: Headers;
  url: string;
// export interface RestClientCallReturnType {
//   status: number;
//   data: any;
//   headers: Headers;
//   url: string;
};

// ################################################################################################
export interface RemoteStoreActionReturnType {
  status: "ok" | "error";
  errorMessage?: string;
  error?: MError;
  instanceCollection?: EntityInstanceCollection;
}

// ################################################################################################
/**
 * Decorator for RestClientInterface, should eventually replace it entirely.
 * Should allow to hide implementation details, such as the use of REST and/or GraphQL
 */
export interface RestPersistenceClientAndRestClientInterface {
  handleNetworkPersistenceAction(
    action: PersistenceAction,
  ): Promise<RestClientCallReturnType>;
}

export default {};

// ################################################################################################
/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface PersistenceStoreLocalOrRemoteInterface {
  handlePersistenceAction(action: PersistenceAction): Promise<Action2ReturnType>;
  handleStoreOrBundleActionForLocalStore(action: StoreOrBundleAction): Promise<Action2ReturnType>;
  handlePersistenceActionForLocalCache(action: PersistenceAction): Promise<Action2ReturnType>;
  handlePersistenceActionForLocalPersistenceStore(
    action: PersistenceAction,
    currentModel?: MiroirModelEnvironment, // TODO: make non-optional
  ): Promise<Action2ReturnType>;
  handlePersistenceActionForRemoteStore(action: PersistenceAction): Promise<Action2ReturnType>;
  handleLocalCacheAction(action: LocalCacheAction): Action2ReturnType;
}

export interface StoreInterface extends LocalCacheInterface, PersistenceStoreLocalOrRemoteInterface {};
