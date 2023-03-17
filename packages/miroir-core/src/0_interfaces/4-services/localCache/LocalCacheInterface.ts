import { DomainAction, DomainDataAction, DomainModelAction } from '../../2_domain/DomainControllerInterface.js';

export default {}

// export declare type DomainDataAction = DomainDataAction; // Todo: suppress type alias?

// export declare type DomainModelAction = DomainModelAction; // Todo: suppress type alias?

// export declare type LocalCacheAction = DomainAction; // Todo: suppress type alias?

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
  // handleLocalCacheModelAction(action:DomainDataAction):RemoteStoreCRUDActionReturnType;
  handleLocalCacheModelAction(action:DomainModelAction);
  handleLocalCacheDataAction(action:DomainDataAction);
  handleLocalCacheAction(action:DomainAction);
  // currentTransaction():any[]; // any so as not to constrain implementation of cache and transaction mechanisms.
  currentTransaction():DomainModelAction[]; // any so as not to constrain implementation of cache and transaction mechanisms.
  currentInfo(): LocalCacheInfo;

}
