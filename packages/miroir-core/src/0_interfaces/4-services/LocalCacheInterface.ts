import {
  LocalCacheInfo
} from "../2_domain/DomainControllerInterface";

import {
  ActionReturnType,
  LocalCacheAction,
  MetaModel,
  ModelAction,
  TransactionalInstanceAction
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface LocalCacheInterface
{
  // constructor
  run(): void;
  // view of current data state & transaction
  getInnerStore(): any; // TODO: local store should not expose its implementation!!
  getState(): any; // TODO: local store should not directly expose its internal state!!
  currentInfo(): LocalCacheInfo;
  currentModel(deploymentUuid:string): MetaModel;
  currentTransaction():(TransactionalInstanceAction | ModelAction)[]; // any so as not to constrain implementation of cache and transaction mechanisms.

  // ##############################################################################################
  handleAction(action:LocalCacheAction):ActionReturnType;
}
