import { DomainAction } from "../2_domain/DomainControllerInterface";
import { RemoteStoreAction, RemoteStoreActionReturnType } from "../../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { LocalCacheAction, LocalCacheInfo } from "../../0_interfaces/4-services/localCache/LocalCacheInterface";

export interface DataControllerInterface {
  loadConfigurationFromRemoteDataStore():Promise<void>;
  handleLocalCacheModelAction(action:DomainAction);
  handleLocalCacheDataAction(action:DomainAction);
  handleRemoteStoreAction(action:RemoteStoreAction):Promise<RemoteStoreActionReturnType>;
  currentLocalCacheTransaction():LocalCacheAction[];
  currentLocalCacheInfo(): LocalCacheInfo;

}

export default {}