import { LocalCacheInfo } from "../4-services/localCache/LocalCacheInterface";
import {
  RemoteStoreAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction,
} from "../4-services/remoteStore/RemoteDataStoreInterface";
import { DomainAction, DomainDataAction, DomainModelAction } from "../2_domain/DomainControllerInterface";

export interface LocalAndRemoteControllerInterface {
  loadConfigurationFromRemoteDataStore(): Promise<void>;
  handleLocalCacheModelAction(action: DomainModelAction);
  handleLocalCacheDataAction(action: DomainDataAction);
  handleLocalCacheAction(action: DomainAction);
  handleRemoteStoreCRUDAction(action: RemoteStoreAction): Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelAction(action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType>;
  currentLocalCacheTransaction(): DomainModelAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}

export default {};
