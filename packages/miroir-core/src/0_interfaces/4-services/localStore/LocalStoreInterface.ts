import { DomainAction } from '../../../0_interfaces/2_domain/DomainLanguageInterface.js';

export default {}

export declare type LocalCacheAction = DomainAction;
/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface LocalStoreInterface
{
  // constructor
  run(): void;
  getInnerStore(): any; // TODO: local store should not expose its implementation!!
  // handleLocalCacheAction(action:DomainAction):RemoteStoreActionReturnType;
  handleLocalCacheAction(action:LocalCacheAction);

}
