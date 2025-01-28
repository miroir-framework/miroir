import { z } from "zod";

import {
  CompositeAction,
  CompositeActionTemplate,
  DomainAction,
  EntityInstance,
  EntityInstancesUuidIndex,
  MetaModel,
  ModelAction,
  RunBoxedExtractorOrQueryAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  TestCompositeAction,
  TestCompositeActionSuite,
  TestCompositeActionTemplateSuite,
  TransactionalInstanceAction
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { LocalCacheInterface } from "../4-services/LocalCacheInterface.js";
import { PersistenceStoreLocalOrRemoteInterface } from "../4-services/PersistenceInterface.js";
import { Action2ReturnType, Action2VoidReturnType } from "./DomainElement.js";


// #############################################################################################
export const CUDActionNamesArray = ["create", "update", "delete"] as const;
export const CUDActionNameSchema = z.enum(CUDActionNamesArray);

export type CUDActionName = z.infer<typeof CUDActionNameSchema>;

// #############################################################################################
export interface LocalCacheInfo {
  localCacheSize: number;
}

// #############################################################################################


export const CRUDActionNamesArray = [
  ...CUDActionNamesArray,
  "read",
] as const;
export const CRUDActionNameSchema = z.enum(
  CRUDActionNamesArray
);
export type CRUDActionName = z.infer<typeof CRUDActionNameSchema>;
export const CRUDActionNamesArrayString: string[] = CRUDActionNamesArray.map((a) => a);

// #############################################################################################
// #############################################################################################
// #############################################################################################
// #############################################################################################

// ###################################################################################
export interface EntitiesDomainState {
  // TODO: to use in redux, this should be the structure of the state manipulated by the client. Right now, the type is duplicated internally within miroir-localcache-redux.
  [entityUuid: string]: EntityInstancesUuidIndex;
}

// ###################################################################################
export interface DeploymentSectionDomainState {
  // TODO: to use in redux, this should be the structure of the state manipulated by the client. Right now, the type is duplicated internally within miroir-localcache-redux.
  [section: string]: EntitiesDomainState;
}

// ###################################################################################
export interface DomainState {
  // TODO: to use in redux, this should be the structure of the state manipulated by the client. Right now, the type is duplicated internally within miroir-localcache-redux.
  [deploymentUuid: string]: DeploymentSectionDomainState;
}

// ###################################################################################
export type EntitiesDomainStateTransformer = (domainState: EntitiesDomainState) => EntitiesDomainState;
export type EntitiesDomainStateEntityInstanceArraySelector = (domainState: EntitiesDomainState) => EntityInstance[];
export type EntitiesDomainStateInstanceSelector = (domainState: EntitiesDomainState) => EntityInstance | undefined;
export type EntitiesDomainStateReducer = (domainState: EntitiesDomainState) => any;

export type DomainStateMetaModelSelector = (domainState: DomainState) => MetaModel | undefined;

export type EntityInstancesUuidIndexEntityInstanceArraySelector = (entityInstancesUuidIndex: EntityInstancesUuidIndex) => EntityInstance[];

// ###################################################################################
export interface DomainControllerInterface {
  // handleAction(deploymentUuid: Uuid, action: DomainAction, currentModel?: MetaModel): Promise<void>;
  handleQueryActionOrBoxedExtractorAction(
    action: RunBoxedExtractorOrQueryAction,
    currentModel?: MetaModel
  ): Promise<Action2ReturnType>;
  handleQueryTemplateActionForServerONLY(
    action: RunBoxedQueryTemplateAction,
    currentModel?: MetaModel
  ): Promise<Action2ReturnType>;
  handleBoxedExtractorTemplateActionForServerONLY(
    action: RunBoxedExtractorTemplateAction,
    currentModel?: MetaModel
  ): Promise<Action2ReturnType>;
  handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
    action: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
    currentModel?: MetaModel
  ): Promise<Action2ReturnType>;
  // handleCompositeActionTemplate(action: CompositeInstanceActionTemplate, actionParamValues: any, currentModel?: MetaModel): Promise<Action2VoidReturnType>;
  handleCompositeActionTemplate(
    action: CompositeActionTemplate,
    actionParamValues: any,
    currentModel?: MetaModel
  ): Promise<Action2VoidReturnType>;
  handleCompositeAction(
    action: CompositeAction,
    actionParamValues: Record<string, any>,
    currentModel?: MetaModel
  ): Promise<Action2VoidReturnType>;
  // ##############################################################################################
  handleTestCompositeAction(
    testAction: TestCompositeAction,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  ): Promise<Action2VoidReturnType>;
  handleTestCompositeActionSuite(
    testAction: TestCompositeActionSuite,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  // ): Promise<Action2VoidReturnType>;
  ): Promise<Action2ReturnType>;
  handleTestCompositeActionTemplateSuite(
    testAction: TestCompositeActionTemplateSuite,
    actionParamValues: Record<string, any>,
    currentModel: MetaModel
  ): Promise<Action2VoidReturnType>;

  handleAction(action: DomainAction, currentModel?: MetaModel): Promise<Action2VoidReturnType>;
  /**
   * data access must accomodate different styles of access
   * => compile-time dependency on types in miroir-core? Or use "any"?
   * There must be a two-phase process to access data (?)
   * first step: getting one's preferred way of getting data, depending on chosen implementation
   * What does it perform concretely?
   * first function / DomainController factory: takes concrete implementation (Redux, Angular Service...) as input?
   * first function returns either: (a set of) react hooks, an angular Service, an Rxjs Observable?
   * output of first function: function producing object producing data? function producing function producing data?
   * is it possible to have a common interface for these very different implementations?
   *
   * second step: accessing data
   * input of second function, producing data: jzod schema, context (deployment uuid, selfApplication section...)
   * output of second function:
   *
   * have a Query interface for a facade to the data-access operations provided by DomainController?
   * - to accomodate for "elaborate" cache-management (performs a remote access in the case the desired data is absent from the cache )
   * - to perform "complex" queries (interpretation required)
   * operations can be asynchronous.
   *
   * react hooks wrapping miroir-core functions
   * angular services returning rxjs observables wrapping miroir-core functions
   *
   * use of Redux + Angular?
   *
   *
   * OR:
   * - write "standard" set of functions for each local store implementation providing EntitiesDomainState (or other) to the local data computation function
   *
   * each computation is split into several parts with asynchronous return of result:
   * estimate if all needed data is present in the local storage
   * - if yes apply computation function directly
   * - if no ask server to perform needed task, wait for results on convened reception point
   * => need to have a standard mechanism for spawning / collecting task results
   *
   * steps:
   * - collect / compute on server / database, using data from server cache (?)
   * - receive reduced data or Entity instances from server, with residual finishing / consolidation step on client side
   *
   *
   */
  // TODO: currentTransaction should not depend on localCache types?! Use DomainActions instead?
  currentTransaction(): (TransactionalInstanceAction | ModelAction)[];
  currentLocalCacheInfo(): LocalCacheInfo;
  getRemoteStore(): PersistenceStoreLocalOrRemoteInterface;
  getDomainState():DomainState;
  getPersistenceStoreAccessMode(): "local" | "remote";
  getLocalCache():LocalCacheInterface; // TODO: this is a temporary solution to allow the use of the local cache in the webapp.
}
