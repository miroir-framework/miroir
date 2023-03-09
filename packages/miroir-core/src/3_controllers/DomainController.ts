import { LocalCacheInfo } from "../0_interfaces/4-services/localCache/LocalCacheInterface";
import { CRUDActionName, CRUDActionNamesArray, DomainCRUDAction, DomainControllerInterface, RemoteStoreOnlyActionName } from "../0_interfaces/2_domain/DomainControllerInterface";
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
  currentTransaction():DomainCRUDAction[]{
    return this.dataController.currentLocalCacheTransaction();
  };

  // ########################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.dataController.currentLocalCacheInfo();
  }

  // ########################################################################################
  async handleDomainCRUDAction(domainAction:DomainCRUDAction):Promise<void>{
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainCRUDAction',domainAction);
    if (CRUDActionNamesArray.map(a=>a.toString()).includes(domainAction.actionName)) {
      // CRUD actions. The same action is performed on the local cache and on the remote store for Data Instances, 
      // and only on the local cache for Model Instances (Model instance CRUD actions are grouped in transactions)
      if (["Entity", "Report"].includes(domainAction.objects[0].entity)) { //TODO: detect Data Entities based on their "conceptLevel" property
        // transactional modification: the changes are done only locally, until commit
        this.dataController.handleLocalCacheModelAction(domainAction);
      } else {
        // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)
        for (const instances of domainAction.objects) {
          // TODO: replace with parallel implementation Promise.all?
          console.log(
            "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainCRUDAction handling instances",
            instances
          );
          await this.dataController.handleRemoteStoreCRUDAction({
            actionName: domainAction.actionName.toString() as CRUDActionName,
            entityName: instances.entity,
            objects: instances.instances,
          } as RemoteStoreCRUDAction);
        }
        this.dataController.handleLocalCacheDataAction(domainAction);
      }
      // }
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainCRUDAction end", domainAction);
    } else {
      // non-CRUD actions, all at Model level (not Data level)
      switch (domainAction.actionName) {
        case 'replace': {
          await this.dataController.loadConfigurationFromRemoteDataStore();
          break;
        }
        case 'undo':
        case 'redo': {
          this.dataController.handleLocalCacheModelAction(
            domainAction
          );
          break;
        }
        case 'commit': {
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
            domainAction
          );
          break;
        }
        case 'resetModel': {
          await this.dataController.handleRemoteStoreCRUDAction(
            {
              actionName: domainAction.actionName.toString() as RemoteStoreOnlyActionName,
              // entityName: undefined,
              // objects: [domainAction]
            }
          );
          break;
        }
        default: {
          console.warn('DomainController handleDomainCRUDAction cannot handle action name',domainAction);
          break;
        }
      }
    }
    return Promise.resolve()
  };

}