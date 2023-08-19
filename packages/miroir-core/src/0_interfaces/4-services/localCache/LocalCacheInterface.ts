import { Uuid } from '../../../0_interfaces/1_core/EntityDefinition.js';
import { MiroirApplicationModel } from '../../1_core/Model.js';
import { LocalCacheInfo } from "../../../0_interfaces/2_domain/DomainControllerInterface";

import {
  DomainAncillaryOrReplayableAction,
  DomainDataAction,
  DomainTransactionalAncillaryOrReplayableAction,
  DomainTransactionalReplayableAction,
} from "../../2_domain/DomainControllerInterface.js";

export default {}

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
  handleLocalCacheDataAction(deploymentUuid: Uuid, action:DomainDataAction):void;
  handleLocalCacheAction(deploymentUuid: Uuid, action:DomainAncillaryOrReplayableAction):void;
}
