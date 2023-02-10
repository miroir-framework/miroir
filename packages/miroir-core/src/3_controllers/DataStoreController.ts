import { MiroirContextInterface } from "./MiroirContext.js";
import { InstanceCollection, InstanceWithName } from "../0_interfaces/1_core/Instance.js";
import { DataControllerInterface } from "../0_interfaces/3_controllers/DataControllerInterface.js";
import { LocalStoreInterface } from "../0_interfaces/4-services/localStore/LocalStoreInterface.js";
import { RemoteStoreAction, RemoteDataStoreInterface, RemoteStoreActionReturnType } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
import { throwExceptionIfError } from "./ErrorUtils.js";
import { DomainAction } from "../0_interfaces/2_domain/DomainLanguageInterface.js";

export default {}

/**
 * controller should allow configuration of local storage / external storage balance.
 * when data is fetched / purged from local storage.
 * use asynchrony or saga-like implementation for data controller, instead of notifications?
 * allow monitoring of local storage resources.
 */
export class DataStoreController implements DataControllerInterface {

  constructor(
    private miroirContext: MiroirContextInterface,
    private localStore: LocalStoreInterface,
    private remoteStore: RemoteDataStoreInterface,
  ) {}

  public async loadConfigurationFromRemoteDataStore() {
    try {
      const entities: InstanceCollection = (await throwExceptionIfError(
        this.miroirContext.errorLogService,
        // this.remoteStore.fetchAllEntityDefinitionsFromRemoteDataStore,
        this.remoteStore.handleRemoteStoreAction,
        this.remoteStore,
        {
          actionName: "read",
          entityName:'Entity'
        } as RemoteStoreAction
      ))[0];
      console.log("DataStoreController loadConfigurationFromRemoteDataStore found entities", entities);
      // const instances: InstanceCollection[] = await throwExceptionIfError(
      //   this.miroirContext.errorLogService,
      //   // this.remoteStore.fetchInstancesForEntityListFromRemoteDatastore,
      //   this.remoteStore.handleRemoteStoreAction,
      //   this.remoteStore,
      //   // entities[0].instances
      //   {
      //     actionName: "read",
      //     entityName:'Instance',
      //     objects:entities[0].instances
      //   } as RemoteStoreAction
      // );
      let instances: InstanceCollection[] = [];
      
      // entities[0].instances.forEach(
      for (const e of entities.instances) {
        // async (e:InstanceWithName) => {
          // const entityInstances:InstanceCollection = await throwExceptionIfError(
          console.log("DataStoreController loadConfigurationFromRemoteDataStore loading instances for entity", e['name']);
          const entityInstances:InstanceCollection[] = await throwExceptionIfError(
            this.miroirContext.errorLogService,
            // this.remoteStore.fetchInstancesForEntityListFromRemoteDatastore,
            this.remoteStore.handleRemoteStoreAction,
            this.remoteStore,
            {
              actionName: "read",
              entityName:e['name'],
            } as RemoteStoreAction
          );
          console.log("DataStoreController loadConfigurationFromRemoteDataStore found instances for entity", e['name'], entityInstances);
          instances.push(entityInstances[0]);
        }
      // )
      console.log("DataStoreController loadConfigurationFromRemoteDataStore instances", instances);
      // await this.localStore.replaceAllInstances(instances);
      // this.localStore.replaceAllInstances(instances);
      this.localStore.handleLocalCacheAction(
        {
          actionName: "replace",
          entityName:'Instance',
          objects: instances
        } as DomainAction
      );
      return;
    } catch (error) {
      console.warn("DataStoreController loadConfigurationFromRemoteDataStore", error);
    }
  }
}
