import { DomainAncillaryOrReplayableAction, DomainDataAction, DomainModelAncillaryOrReplayableAction, DomainModelReplayableAction } from "../2_domain/DomainControllerInterface";
import { LocalCacheInfo } from "../4-services/localCache/LocalCacheInterface";
import {
  RemoteStoreAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction,
} from "../4-services/remoteStore/RemoteDataStoreInterface";

export interface LocalAndRemoteControllerInterface {
  loadConfigurationFromRemoteDataStore(): Promise<void>;
  handleLocalCacheModelAction(action: DomainModelAncillaryOrReplayableAction);
  handleLocalCacheDataAction(action: DomainDataAction);
  handleLocalCacheAction(action: DomainAncillaryOrReplayableAction);
  handleRemoteStoreCRUDAction(action: RemoteStoreAction): Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelAction(action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType>;
  currentLocalCacheTransaction(): DomainModelReplayableAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}

export default {};
