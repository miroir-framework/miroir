import { Uuid } from '../../../0_interfaces/1_core/EntityDefinition.js';
import { MiroirApplicationModel } from '../../1_core/Model.js';
import { LocalCacheInfo } from "../../../0_interfaces/2_domain/DomainControllerInterface";

import {
  DomainAncillaryOrReplayableOrLocalCacheAction,
  DomainDataAction,
  DomainTransactionalAncillaryOrReplayableAction,
  DomainTransactionalReplayableAction,
} from "../../2_domain/DomainControllerInterface.js";
import { LocalCacheAction } from '../../1_core/preprocessor-generated/miroirFundamentalType.js';

// ################################################################################################
export interface LocalCacheActionWithDeployment {
  deploymentUuid: Uuid,
  localCacheAction: LocalCacheAction,
}

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
  currentModel(deploymentUuid:string): MiroirApplicationModel;
  currentTransaction():DomainTransactionalReplayableAction[]; // any so as not to constrain implementation of cache and transaction mechanisms.
  // actions on local cache
  handleLocalCacheModelAction(deploymentUuid: Uuid, action:DomainTransactionalAncillaryOrReplayableAction):void;
  handleLocalCacheDomainAction(deploymentUuid: Uuid, action:DomainAncillaryOrReplayableOrLocalCacheAction):void;
  handleLocalCacheAction(action:LocalCacheActionWithDeployment):void;
}
