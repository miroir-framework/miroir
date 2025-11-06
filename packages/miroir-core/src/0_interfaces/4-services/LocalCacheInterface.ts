import {
  DomainState,
  LocalCacheInfo
} from "../2_domain/DomainControllerInterface";

import {
  LocalCacheAction,
  MetaModel,
  ModelActionReplayableAction,
  RunBoxedExtractorOrQueryAction,
  TransactionalInstanceAction
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import { Action2ReturnType } from "../2_domain/DomainElement";
import type { MiroirModelEnvironment } from "../1_core/Transformer";

// ################################################################################################
/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface LocalCacheInterface
{
  // constructor
  // run(): void;

  // view of current data state & transaction
  getInnerStore(): any; // TODO: local store should not expose its implementation!!
  getState(): any; // TODO: local store should not directly expose its internal state!! Actual type is LocacCacheSliceState!
  currentInfo(): LocalCacheInfo;
  currentModel(deploymentUuid:string): MetaModel;
  currentModelEnvironment(deploymentUuid:string): MiroirModelEnvironment;
  currentTransaction():(TransactionalInstanceAction | ModelActionReplayableAction)[]; // any so as not to constrain implementation of cache and transaction mechanisms.

  getDomainState():DomainState;

  // ##############################################################################################
  handleLocalCacheAction(action:LocalCacheAction):Action2ReturnType;
  runBoxedExtractorOrQueryAction(action:RunBoxedExtractorOrQueryAction):Action2ReturnType;
}
