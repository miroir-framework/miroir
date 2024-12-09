import { HttpMethod } from "../1_core/Http";
import {
  ActionReturnType,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  EntityInstance,
  EntityInstanceCollection,
  PersistenceAction,
  BoxedQueryWithExtractorCombinerTransformer
} from "../1_core/preprocessor-generated/miroirFundamentalType";
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
  localCache: LocalCacheInterface,
  // method: HttpMethod | undefined, // unused!
  method: HttpMethod, // unused!
  effectiveUrl: string, // log only, to remove?
  // body: HttpRequestBodyFormat | undefined, // unused!
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
  get(endpoint: string, customConfig?: any): Promise<RestClientCallReturnType>;
  post(endpoint: string, body: any, customConfig?: any): Promise<RestClientCallReturnType>;
  put(endpoint: string, body: any, customConfig?: any): Promise<RestClientCallReturnType>;
  delete(endpoint: string, body: any, customConfig?: any): Promise<RestClientCallReturnType>;
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
  ): Promise<ActionReturnType>;
}

export interface StoreInterface extends LocalCacheInterface, PersistenceStoreLocalOrRemoteInterface {};
