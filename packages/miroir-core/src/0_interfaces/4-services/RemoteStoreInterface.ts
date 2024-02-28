import { HttpMethod } from "../1_core/Http.js";
import {
  ActionReturnType,
  ApplicationSection,
  BundleAction,
  EntityInstance,
  EntityInstanceCollection,
  StoreOrBundleAction,
  ModelAction,
  StoreAction
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  CRUDActionName
} from "../2_domain/DomainControllerInterface.js";
import { MError } from "../3_controllers/ErrorLogServiceInterface.js";
import { StoreControllerManagerInterface } from "./StoreControllerManagerInterface.js";


// ################################################################################################
export interface HttpRequestBodyFormat {
  instances?: EntityInstance[];
  crudInstances?: EntityInstance[];
  modelUpdate?: any;
  other?: any;
};

// ################################################################################################
export interface HttpResponseBodyFormat {
  instances: EntityInstance[]
};

// ################################################################################################
export type RestMethodHandler =  (
  continuationFunction: (response:any) =>(arg0: any) => any,
  storeControllerManager: StoreControllerManagerInterface,
  method: HttpMethod | undefined, // unused!
  response: any,
  effectiveUrl: string, // log only, to remove?
  body: HttpRequestBodyFormat | undefined, // unused!
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
export interface RemoteStoreCRUDAction {
  actionType: "RemoteStoreCRUDAction";
  actionName: CRUDActionName;
  section: ApplicationSection,
  parentName?: string; //redundant with object list
  parentUuid?: string; //redundant with object list
  uuid?: string; //redundant with object list
  objects?: EntityInstance[];
}

// ################################################################################################
export type RemoteStoreAction =
  | RemoteStoreCRUDAction
  | ModelAction
  | StoreAction
  | BundleAction;

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
export interface RemoteStoreNetworkClientInterface {
  handleNetworkRemoteStoreCRUDAction(
    deploymentUuid: string,
    action: RemoteStoreCRUDAction
  ): Promise<RestClientCallReturnType>;
  handleNetworkRemoteStoreModelEntityAction(
    deploymentUuid: string,
    action: ModelAction
  ): Promise<RestClientCallReturnType>;
  handleNetworkRemoteStoreOrBundleAction(
    deploymentUuid: string,
    action: StoreOrBundleAction
  ): Promise<RestClientCallReturnType>;
  handleNetworkRemoteStoreAction(
    deploymentUuid: string,
    action: RemoteStoreAction,
  ): Promise<RestClientCallReturnType>;
}

export default {};

// ################################################################################################
/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteStoreInterface {
  handleRemoteStoreRestCRUDAction(
    deploymentUuid: string,
    action: RemoteStoreCRUDAction
  ): Promise<ActionReturnType>;
  handleRemoteStoreModelAction(
    deploymentUuid: string,
    action: ModelAction
  ): Promise<ActionReturnType>;
  handleRemoteStoreActionOrBundleAction(
    deploymentUuid: string,
    action: StoreOrBundleAction
  ): Promise<ActionReturnType>;
  handleRemoteStoreAction(
    deploymentUuid: string,
    action: RemoteStoreAction
  ): Promise<ActionReturnType>;
}

