import { HttpMethod } from "../1_core/Http.js";
import { MiroirConfig } from "../1_core/MiroirConfig.js";
import {
  ApplicationSection,
  ModelAction,
  EntityInstance,
  EntityInstanceCollection,
  StoreAction,
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  CRUDActionName,
  DomainModelInitAction,
  DomainTransactionalActionWithCUDUpdate,
  DomainTransactionalResetDataAction,
  DomainTransactionalResetModelAction,
} from "../2_domain/DomainControllerInterface.js";
import { MError } from "../3_controllers/ErrorLogServiceInterface.js";
import { IStoreController } from "./StoreControllerInterface.js";
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
  // miroirConfig:MiroirConfig,
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
  parentName?: string; //redundant with object list
  parentUuid?: string; //redundant with object list
  uuid?: string; //redundant with object list
  objects?: EntityInstance[];
}

// ################################################################################################
export type RemoteStoreOLDModelAction =
  | DomainTransactionalActionWithCUDUpdate
  | DomainTransactionalResetModelAction
  | DomainTransactionalResetDataAction
  | DomainModelInitAction
;

// ################################################################################################
export type RemoteStoreAction = RemoteStoreCRUDAction | RemoteStoreOLDModelAction | ModelAction | StoreAction;

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
    section: ApplicationSection,
    action: RemoteStoreCRUDAction
  ): Promise<RestClientCallReturnType>;
  handleNetworkRemoteStoreOLDModelAction(
    deploymentUuid: string,
    action: RemoteStoreOLDModelAction
  ): Promise<RestClientCallReturnType>;
  handleNetworkRemoteStoreModelEntityAction(
    deploymentUuid: string,
    action: ModelAction
  ): Promise<RestClientCallReturnType>;
  handleNetworkRemoteAction(
    deploymentUuid: string,
    action: StoreAction
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
    section: ApplicationSection,
    action: RemoteStoreCRUDAction
  ): Promise<RemoteStoreActionReturnType>;
  handleRemoteStoreOLDModelAction(
    deploymentUuid: string,
    action: RemoteStoreOLDModelAction
  ): Promise<RemoteStoreActionReturnType>;
  handleRemoteStoreModelEntityAction(
    deploymentUuid: string,
    action: ModelAction
  ): Promise<RemoteStoreActionReturnType>;
  handleRemoteAction(
    deploymentUuid: string,
    action: StoreAction
  ): Promise<RemoteStoreActionReturnType>;
}

