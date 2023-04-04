import { MiroirModel } from '../../../0_interfaces/1_core/ModelInterface.js';
import { DomainAction, DomainDataAction, DomainModelAction, DomainModelReplayableAction } from '../../2_domain/DomainControllerInterface.js';

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
  handleLocalCacheModelAction(action:DomainModelAction);
  handleLocalCacheDataAction(action:DomainDataAction);
  handleLocalCacheAction(action:DomainAction);
  currentTransaction():DomainModelReplayableAction[]; // any so as not to constrain implementation of cache and transaction mechanisms.
  currentInfo(): LocalCacheInfo;
  currentModel(): MiroirModel;
}
