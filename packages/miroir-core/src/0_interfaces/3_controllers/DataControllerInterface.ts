import { DomainAction, DomainDataAction, DomainModelAction } from "../2_domain/DomainControllerInterface";
import { RemoteStoreAction, RemoteStoreCRUDActionReturnType, RemoteStoreModelAction } from "../../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { LocalCacheDataAction, LocalCacheInfo, LocalCacheModelAction } from "../../0_interfaces/4-services/localCache/LocalCacheInterface";

export interface DataControllerInterface {
  loadConfigurationFromRemoteDataStore():Promise<void>;
  handleLocalCacheModelAction(action:DomainModelAction);
  handleLocalCacheDataAction(action:DomainDataAction);
  handleLocalCacheAction(action:DomainAction);
  handleRemoteStoreCRUDAction(action:RemoteStoreAction):Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelAction(action:RemoteStoreModelAction):Promise<RemoteStoreCRUDActionReturnType>;
  currentLocalCacheTransaction():LocalCacheModelAction[];
  currentLocalCacheInfo(): LocalCacheInfo;

}

export default {}