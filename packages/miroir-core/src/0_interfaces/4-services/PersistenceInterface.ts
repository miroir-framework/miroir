import { HttpMethod } from "../1_core/Http.js";
import {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  EntityInstance,
  EntityInstanceCollection,
  PersistenceAction,
  BoxedQueryWithExtractorCombinerTransformer,
  StoreOrBundleAction,
  LocalCacheAction
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainControllerInterface } from "../2_domain/DomainControllerInterface.js";
import { Action2ReturnType } from "../2_domain/DomainElement.js";
import { MError } from "../3_controllers/ErrorLogServiceInterface.js";
import { LocalCacheInterface } from "./LocalCacheInterface.js";
import { PersistenceStoreControllerManagerInterface } from "./PersistenceStoreControllerManagerInterface.js";


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
export interface RestClientCallReturnType {
  status: number;
  data: any;
  headers: Headers;
  url: string;
}

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
  handlePersistenceAction(
    action: PersistenceAction
  ): Promise<Action2ReturnType>;
  handleStoreOrBundleActionForLocalStore(
    action: StoreOrBundleAction
  ): Promise<Action2ReturnType>;
  handlePersistenceActionForLocalCache(action: PersistenceAction): Promise<Action2ReturnType>;
  handlePersistenceActionForLocalPersistenceStore(action: PersistenceAction): Promise<Action2ReturnType>;
  handlePersistenceActionForRemoteStore(action: PersistenceAction): Promise<Action2ReturnType>;
  handleLocalCacheAction(action: LocalCacheAction): Action2ReturnType;
}

export interface StoreInterface extends LocalCacheInterface, PersistenceStoreLocalOrRemoteInterface {};
