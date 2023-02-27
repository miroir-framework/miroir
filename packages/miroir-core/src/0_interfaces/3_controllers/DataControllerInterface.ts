import { DomainAction } from "../2_domain/DomainControllerInterface";
import { RemoteStoreAction, RemoteStoreActionReturnType } from "../../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { LocalCacheInfo } from "../../0_interfaces/4-services/localCache/LocalCacheInterface";

export interface DataControllerInterface {
  loadConfigurationFromRemoteDataStore():Promise<void>;
  handleLocalCacheAction(action:DomainAction);
  handleRemoteStoreAction(action:RemoteStoreAction):Promise<RemoteStoreActionReturnType>;
  currentLocalCacheTransaction():any[];
  currentLocalCacheInfo(): LocalCacheInfo;

}

export default {}