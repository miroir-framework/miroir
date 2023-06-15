import { ApplicationSection, EntityInstance, EntityInstanceCollection } from "../../../0_interfaces/1_core/Instance.js";
import { MError } from "../../../0_interfaces/3_controllers/ErrorLogServiceInterface.js";
import {
  CRUDActionName,
  DomainModelInitAction,
  DomainTransactionalReplayableAction,
  DomainTransactionalResetDataAction,
  DomainTransactionalResetModelAction,
} from "../../2_domain/DomainControllerInterface.js";

export interface RemoteStoreCRUDAction {
  actionType: "RemoteStoreCRUDAction";
  actionName: CRUDActionName;
  parentName?: string; //redundant with object list
  parentUuid?: string; //redundant with object list
  uuid?: string; //redundant with object list
  objects?: EntityInstance[];
}

export type RemoteStoreModelAction =
  | DomainTransactionalReplayableAction
  | DomainTransactionalResetModelAction
  | DomainTransactionalResetDataAction
  | DomainModelInitAction
;

export type RemoteStoreAction = RemoteStoreCRUDAction | RemoteStoreModelAction;

export interface RemoteStoreCRUDActionReturnType {
  status: "ok" | "error";
  errorMessage?: string;
  error?: MError;
  // instances: EntityInstanceCollection[]
  instanceCollection?: EntityInstanceCollection;
}

export interface RestClientCallReturnType {
  status: number;
  data: any;
  // headers: any;
  headers: Headers;
  url: string;
}

export interface RestClientInterface {
  get(endpoint: string, customConfig?: any): Promise<RestClientCallReturnType>;
  post(endpoint: string, body: any, customConfig?: any): Promise<RestClientCallReturnType>;
  put(endpoint: string, body: any, customConfig?: any): Promise<RestClientCallReturnType>;
  delete(endpoint: string, body: any, customConfig?: any): Promise<RestClientCallReturnType>;
}

/**
 * Decorator for RestClientInterface, should eventually replace it entirely.
 * Should allow to hide implementation details, such as the use of REST and/or GraphQL
 */
export interface RemoteStoreNetworkClientInterface {
  handleNetworkAction(networkAction: RemoteStoreAction): Promise<RestClientCallReturnType>; //TODO: return type must be independent of actually called client
  handleNetworkRemoteStoreCRUDActionWithDeployment(
    deploymentUuid: string,
    section: ApplicationSection,
    action: RemoteStoreCRUDAction
  ): Promise<RestClientCallReturnType>;
  handleNetworkRemoteStoreModelActionWithDeployment(
    deploymentUuid: string,
    action: RemoteStoreModelAction
  ): Promise<RestClientCallReturnType>;
}

export default {};

/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface RemoteDataStoreInterface {
  handleRemoteStoreCRUDActionWithDeployment(
    deploymentUuid: string,
    section: ApplicationSection,
    action: RemoteStoreCRUDAction
  ): Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelActionWithDeployment(
    deploymentUuid: string,
    action: RemoteStoreModelAction
  ): Promise<RemoteStoreCRUDActionReturnType>;
}
