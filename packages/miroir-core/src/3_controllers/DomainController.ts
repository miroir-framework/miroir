import { LocalCacheInfo } from "../0_interfaces/4-services/localCache/LocalCacheInterface";
import { CRUDActionName, CRUDActionNamesArray, DomainDataAction, DomainControllerInterface, ModelActionName, DomainModelAction } from "../0_interfaces/2_domain/DomainControllerInterface";
import { DataControllerInterface } from "../0_interfaces/3_controllers/DataControllerInterface";
import { RemoteStoreCRUDAction, RemoteStoreModelAction } from "src/0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";

/**
 * domain level contains "business" logic related to concepts defined whithin the
 * application: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class DomainController implements DomainControllerInterface {
  constructor(
    private dataController: DataControllerInterface
  ){

  }

  // ########################################################################################
  currentTransaction():DomainModelAction[]{
    return this.dataController.currentLocalCacheTransaction();
  };

  // ########################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.dataController.currentLocalCacheInfo();
  }

  // ########################################################################################
  async handleDomainModelAction(domainModelAction:DomainModelAction):Promise<void>{
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainModelAction actionName',domainModelAction.actionName,'action',domainModelAction);
    // await this.dataController.handleRemoteStoreModelAction(domainAction);

    switch (domainModelAction.actionName) {
      case 'replace': {
        await this.dataController.loadConfigurationFromRemoteDataStore();
        break;
      }
      case 'undo':
      case 'redo': {
        this.dataController.handleLocalCacheModelAction(
          domainModelAction
        );
        break;
      }
      case 'commit': {
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit',this.dataController.currentLocalCacheTransaction());
        for (const replayAction of this.dataController.currentLocalCacheTransaction()) {
          console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit',replayAction);
          for (const instances of replayAction.objects) { // TODO: replace with parallel implementation Promise.all?
            await this.dataController.handleRemoteStoreCRUDAction(
              {
                actionName: replayAction.actionName.toString() as CRUDActionName,
                entityName: instances.entity,
                objects: instances.instances
              }
            );
          }
        }
        this.dataController.handleLocalCacheModelAction(
          domainModelAction
        );
        break;
      }
      case "create":
      case "update":
      case "delete": {
        // transactional modification: the changes are done only locally, until commit
        this.dataController.handleLocalCacheAction(
          domainModelAction
          // {
          //   actionName: domainModelAction.actionName as CRUDActionName,
          //   actionType:"DomainDataAction",
          //   objects: domainModelAction.objects,
          // }
        );
        break;
      }
      case 'updateModel': {
        await this.dataController.handleRemoteStoreCRUDAction(
          domainModelAction
          // {
          //   actionName: domainModelAction.actionName.toString() as RemoteStoreOnlyActionName,
          //   actionType:"DomainModelAction",

          //   // entityName: undefined,
          //   // objects: [domainAction]
          // }
        );
        break;
      }

      default: {
        // await this.dataController.handleRemoteStoreModelAction(domainModelAction);
        console.warn('DomainController handleDomainModelAction cannot handle action name',domainModelAction.actionName,'for',domainModelAction);
      break;
      }
    }

    // switch (domainAction.actionName) {
    //   case 'resetModel': {
    //     await this.dataController.handleRemoteStoreModelAction(domainAction
    //       // {
    //       //   actionName: domainAction.actionName.toString() as ModelActionName,
    //       //   // entityName: undefined,
    //       //   actions: [domainAction],
    //       // }
    //     );
    //     break;
    //   }
    // }
  }

  // ########################################################################################
  async handleDomainDataAction(domainAction:DomainDataAction):Promise<void>{
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction',domainAction);
    if (CRUDActionNamesArray.map(a=>a.toString()).includes(domainAction.actionName)) {
      // CRUD actions. The same action is performed on the local cache and on the remote store for Data Instances, 
      // and only on the local cache for Model Instances (Model instance CRUD actions are grouped in transactions)
      // if (["Entity", "Report"].includes(domainAction.objects[0].entity)) { //TODO: detect Data Entities based on their "conceptLevel" property
      //   // transactional modification: the changes are done only locally, until commit
      //   this.dataController.handleLocalCacheDataAction(domainAction);
      // } else {
      // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)
      for (const instances of domainAction.objects) {
        // TODO: replace with parallel implementation Promise.all?
        console.log(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction handling instances",
          instances
        );
        await this.dataController.handleRemoteStoreCRUDAction({
          actionName: domainAction.actionName.toString() as CRUDActionName,
          entityName: instances.entity,
          objects: instances.instances,
        });
      }
      this.dataController.handleLocalCacheDataAction(domainAction);
      // }
      // }
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction end", domainAction);
    } else {
      // non-CRUD actions, all at Model level (not Data level)
    }
    return Promise.resolve()
  };

}