import { DomainAction } from '../../2_domain/DomainControllerInterface.js';

export default {}

export declare type LocalCacheAction = DomainAction;

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
  // handleLocalCacheAction(action:DomainAction):RemoteStoreActionReturnType;
  handleLocalCacheAction(action:LocalCacheAction);
  currentTransaction():LocalCacheAction[]; // any so as not to constrain implementation of cache and transaction mechanisms.
  currentInfo(): LocalCacheInfo;

}
