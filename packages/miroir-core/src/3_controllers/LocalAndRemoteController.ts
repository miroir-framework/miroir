import { metamodelEntities } from "src/3_controllers/ModelInitializer.js";
import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import { EntityInstanceCollection } from "../0_interfaces/1_core/Instance.js";
import { DomainAncillaryOrReplayableAction, DomainDataAction, DomainModelAncillaryOrReplayableAction, DomainModelReplayableAction } from "../0_interfaces/2_domain/DomainControllerInterface.js";
import { LocalAndRemoteControllerInterface } from "../0_interfaces/3_controllers/LocalAndRemoteControllerInterface.js";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface.js";
import {
  LocalCacheInfo,
  LocalCacheInterface
} from "../0_interfaces/4-services/localCache/LocalCacheInterface.js";
import {
  RemoteDataStoreInterface,
  RemoteStoreCRUDAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction
} from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import entityEntity from "../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json";
import entityReport from '../assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';

// import entityDefinitionEntityDefinition from "../assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json";
import { throwExceptionIfError } from "./ErrorUtils.js";

export default {};

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * allow monitoring of local storage resources.
 */
export class LocalAndRemoteController implements LocalAndRemoteControllerInterface {
  constructor(
    private miroirContext: MiroirContextInterface,
    private localCache: LocalCacheInterface,
    private remoteStore: RemoteDataStoreInterface
  ) {}

  //####################################################################################
  public async handleLocalCacheModelAction(deploymentUuid:Uuid, action: DomainModelAncillaryOrReplayableAction) {
    return this.localCache.handleLocalCacheModelAction(deploymentUuid, action);
  }

  //####################################################################################
  public async handleLocalCacheDataAction(deploymentUuid:Uuid, action: DomainDataAction) {
    return this.localCache.handleLocalCacheDataAction(deploymentUuid, action);
  }

  //####################################################################################
  public async handleLocalCacheAction(deploymentUuid:Uuid, action: DomainAncillaryOrReplayableAction) {
    return this.localCache.handleLocalCacheAction(deploymentUuid, action);
  }

  //####################################################################################
  public async handleRemoteStoreCRUDAction(action: RemoteStoreCRUDAction): Promise<RemoteStoreCRUDActionReturnType> {
    return this.remoteStore.handleRemoteStoreCRUDAction(action);
  }

  //####################################################################################
  public async handleRemoteStoreModelAction(action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType> {
    return this.remoteStore.handleRemoteStoreModelAction(action);
  }

  //####################################################################################
  public async handleRemoteStoreCRUDActionWithDeployment(deploymentUuid:string, action: RemoteStoreCRUDAction): Promise<RemoteStoreCRUDActionReturnType> {
    return this.remoteStore.handleRemoteStoreCRUDActionWithDeployment(deploymentUuid, action);
  }

  //####################################################################################
  public async handleRemoteStoreModelActionWithDeployment(deploymentUuid:string, action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType> {
    return this.remoteStore.handleRemoteStoreModelActionWithDeployment(deploymentUuid, action);
  }

  //####################################################################################
  /**
   * .
   * @returns the content of the current local cache transaction, not typed so as not to impose any implementation details
   */
  currentLocalCacheTransaction(): DomainModelReplayableAction[] {
    return this.localCache.currentTransaction();
  }

  //####################################################################################
  /**
   * .
   * @returns the stats about the current local cache.
   */
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.localCache.currentInfo();
  }

  //####################################################################################
  /**
   * performs remote update before local update, so that whenever remote update fails, local value is not modified (going into the "catch").
   * @returns undefined when loading is finished
   */
  public async loadConfigurationFromRemoteDataStore(
    deploymentUuid: string,
  ): Promise<void> {
    try {
      const dataEntities: EntityInstanceCollection = (
        await throwExceptionIfError(
          this.miroirContext.errorLogService,
          this.remoteStore.handleRemoteStoreCRUDActionWithDeployment,
          this.remoteStore, //this
          deploymentUuid,
          {
            actionName: "read",
            parentName: entityEntity.name,
            parentUuid: entityEntity.uuid,
          }
        )
      )[0];

      const modelEntities = metamodelEntities.filter(me=>dataEntities.instances.filter(de=>de.uuid == me.uuid).length == 0)
      // const modelEntities = [entityReport].filter(me=>dataEntities.instances.filter(de=>de.uuid == me.uuid).length == 0)
      const toFetchEntities = [...modelEntities, ...dataEntities.instances];

      console.log("LocalAndRemoteController loadConfigurationFromRemoteDataStore for deployment",deploymentUuid,"found dataentities", dataEntities,"toFetchEntities",toFetchEntities);

      let instances: EntityInstanceCollection[] = [dataEntities]; //TODO: replace with functional implementation
      for (const e of toFetchEntities) {
        // makes sequetial calls to interface. Make parallel calls instead using Promise.all?
        console.log("LocalAndRemoteController loadConfigurationFromRemoteDataStore fecthing instances from server for entity", e["name"]);
        const entityInstances: EntityInstanceCollection[] = await throwExceptionIfError(
          this.miroirContext.errorLogService,
          this.remoteStore.handleRemoteStoreCRUDActionWithDeployment,
          this.remoteStore, // this
          deploymentUuid,
          {
            actionName: "read",
            parentName: e["name"],
            parentUuid: e['uuid'],
          }
        );
        console.log(
          "LocalAndRemoteController loadConfigurationFromRemoteDataStore found instances for entity",
          e["name"],
          entityInstances
        );
        instances.push(entityInstances[0]);
      }

      console.log("LocalAndRemoteController loadConfigurationFromRemoteDataStore all instances fetched from server", instances);
      this.localCache.handleLocalCacheModelAction(
        deploymentUuid,
        {
          actionName: "replace",
          actionType: "DomainModelAction",
          objects: instances,
        }
      );
      return Promise.resolve();
    } catch (error) {
      console.warn("LocalAndRemoteController loadConfigurationFromRemoteDataStore", error);
    }
  }
}
