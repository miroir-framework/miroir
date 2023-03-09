import { DomainCRUDAction } from "../2_domain/DomainControllerInterface";
import { RemoteStoreAction, RemoteStoreCRUDActionReturnType, RemoteStoreModelAction } from "../../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { LocalCacheAction, LocalCacheInfo } from "../../0_interfaces/4-services/localCache/LocalCacheInterface";

export interface DataControllerInterface {
  loadConfigurationFromRemoteDataStore():Promise<void>;
  handleLocalCacheModelAction(action:DomainCRUDAction);
  handleLocalCacheDataAction(action:DomainCRUDAction);
  handleRemoteStoreCRUDAction(action:RemoteStoreAction):Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelAction(action:RemoteStoreModelAction):Promise<RemoteStoreCRUDActionReturnType>;
  currentLocalCacheTransaction():LocalCacheAction[];
  currentLocalCacheInfo(): LocalCacheInfo;

}

export default {}