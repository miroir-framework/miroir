import { Uuid } from '../../../0_interfaces/1_core/EntityDefinition.js';
import { MiroirMetaModel } from '../../1_core/Model.js';
import { DomainAncillaryOrReplayableAction, DomainDataAction, DomainModelAncillaryOrReplayableAction, DomainModelReplayableAction } from '../../2_domain/DomainControllerInterface.js';

export default {}

export interface LocalCacheInfo {
  localCacheSize: number;
}
/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface LocalCacheInterface
{
  // constructor
  run(): void;
  getInnerStore(): any; // TODO: local store should not expose its implementation!!
  handleLocalCacheModelAction(deploymentUuid: Uuid, action:DomainModelAncillaryOrReplayableAction);
  handleLocalCacheDataAction(deploymentUuid: Uuid, action:DomainDataAction);
  handleLocalCacheAction(deploymentUuid: Uuid, action:DomainAncillaryOrReplayableAction);
  currentTransaction():DomainModelReplayableAction[]; // any so as not to constrain implementation of cache and transaction mechanisms.
  currentInfo(): LocalCacheInfo;
  currentModel(): MiroirMetaModel;
}
