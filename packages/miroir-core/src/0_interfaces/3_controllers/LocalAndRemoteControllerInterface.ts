import { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
import { ApplicationSection } from "../1_core/Instance.js";
import { DomainAncillaryOrReplayableAction, DomainDataAction, DomainTransactionalAncillaryOrReplayableAction, DomainTransactionalReplayableAction } from "../2_domain/DomainControllerInterface";
import { LocalCacheInfo } from "../4-services/localCache/LocalCacheInterface";
import {
  RemoteStoreAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction,
} from "../4-services/remoteStore/RemoteDataStoreInterface";

export interface LocalAndRemoteControllerInterface {
  loadConfigurationFromRemoteDataStore(deploymentUuid: string,): Promise<void>;
  handleLocalCacheModelAction(deploymentUuid:Uuid, action: DomainTransactionalAncillaryOrReplayableAction):void;
  handleLocalCacheDataAction(deploymentUuid:Uuid, action: DomainDataAction):void;
  handleLocalCacheAction(deploymentUuid:Uuid, action: DomainAncillaryOrReplayableAction):void;
  handleRemoteStoreCRUDActionWithDeployment(deploymentUuid:string, section: ApplicationSection, action: RemoteStoreAction): Promise<RemoteStoreCRUDActionReturnType>;
  handleRemoteStoreModelActionWithDeployment(deploymentUuid:string, action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType>;
  currentLocalCacheTransaction(): DomainTransactionalReplayableAction[];
  currentLocalCacheInfo(): LocalCacheInfo;
}

export default {};
