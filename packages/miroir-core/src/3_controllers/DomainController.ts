import {
  CRUDActionName,
  CRUDActionNamesArray,
  DomainAction,
  DomainControllerInterface,
  DomainDataAction,
  DomainModelAction,
} from "../0_interfaces/2_domain/DomainControllerInterface";
import { DataControllerInterface } from "../0_interfaces/3_controllers/DataControllerInterface";
import { LocalCacheInfo } from "../0_interfaces/4-services/localCache/LocalCacheInterface";

/**
 * domain level contains "business" logic related to concepts defined whithin the
 * application: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class DomainController implements DomainControllerInterface {
  constructor(private dataController: DataControllerInterface) {}

  // ########################################################################################
  currentTransaction(): DomainModelAction[] {
    return this.dataController.currentLocalCacheTransaction();
  }

  // ########################################################################################
  currentLocalCacheInfo(): LocalCacheInfo {
    return this.dataController.currentLocalCacheInfo();
  }

  // ########################################################################################
  async handleDomainModelAction(domainModelAction: DomainModelAction): Promise<void> {
    console.log(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainModelAction actionName",
      domainModelAction['actionName'],
      "action",
      domainModelAction
    );
    // await this.dataController.handleRemoteStoreModelAction(domainAction);

    switch (domainModelAction.actionName) {
      case "replace": {
        await this.dataController.loadConfigurationFromRemoteDataStore();
        break;
      }
      case "undo":
      case "redo": {
        this.dataController.handleLocalCacheModelAction(domainModelAction);
        break;
      }
      case "commit": {
        console.log(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit",
          this.dataController.currentLocalCacheTransaction()
        );
        for (const replayAction of this.dataController.currentLocalCacheTransaction()) {
          console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController commit", replayAction);
          for (const instances of replayAction["objects"]) {
            // TODO: replace with parallel implementation Promise.all?
            await this.dataController.handleRemoteStoreCRUDAction({
              actionName: replayAction.actionName.toString() as CRUDActionName,
              entityName: instances.entity,
              objects: instances.instances,
            });
          }
        }
        this.dataController.handleLocalCacheModelAction(domainModelAction);
        break;
      }
      case "create":
      case "update":
      case "delete": {
        // transactional modification: the changes are done only locally, until commit
        this.dataController.handleLocalCacheAction(
          domainModelAction
        );
        break;
      }
      case "updateModel": {
        await this.dataController.handleRemoteStoreCRUDAction(
          domainModelAction
        );
        break;
      }

      default: {
        // await this.dataController.handleRemoteStoreModelAction(domainModelAction);
        console.warn("DomainController handleDomainModelAction cannot handle action name for", domainModelAction);
        break;
      }
    }

  }

  // ########################################################################################
  async handleDomainDataAction(domainAction: DomainDataAction): Promise<void> {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction", domainAction.actionName, domainAction.objects);
    // non-transactional modification: perform the changes immediately on the remote datastore (thereby commited)
    if (CRUDActionNamesArray.map((a) => a.toString()).includes(domainAction.actionName)) {
      // CRUD actions. The same action is performed on the local cache and on the remote store for Data Instances,
      // and only on the local cache for Model Instances (Model instance CRUD actions are grouped in transactions)
      for (const instances of domainAction.objects) {
        // TODO: replace with parallel implementation Promise.all?
        console.log(
          "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction handling instances",
          instances.entity, instances.instances
        );
        await this.dataController.handleRemoteStoreCRUDAction({
          actionName: domainAction.actionName.toString() as CRUDActionName,
          entityName: instances.entity,
          objects: instances.instances,
        });
      }
      this.dataController.handleLocalCacheDataAction(domainAction);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction end", domainAction);
    } else {
      console.error(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainDataAction could not handle action name",
        domainAction.actionName,
        "for action",
        domainAction
      );
    }
    return Promise.resolve();
  }

  // ########################################################################################
  async handleDomainAction(domainAction: DomainAction): Promise<void> {
    let entityDomainAction:DomainAction = undefined;
    let otherDomainAction:DomainAction = undefined;
    const ignoredActionNames:string[] = ['updateModel','commit','replace','undo','redo'];
    console.log('handleDomainAction',domainAction?.actionName,domainAction?.actionType,domainAction['objects']);
    
    // if (domainAction.actionName!="updateModel"){
    if (!ignoredActionNames.includes(domainAction.actionName)){
      const entityObjects = Array.isArray(domainAction['objects'])?domainAction['objects'].filter(a=>a.entity=='Entity'):[];
      const otherObjects = Array.isArray(domainAction['objects'])?domainAction['objects'].filter(a=>a.entity!='Entity'):[];

      if(entityObjects.length > 0){
        entityDomainAction = {
          actionType: domainAction.actionType,
          actionName: domainAction.actionName,
          objects: entityObjects
        } as DomainAction
      }
      if(otherObjects.length > 0){
        otherDomainAction = {
          actionType: domainAction.actionType,
          actionName: domainAction.actionName,
          objects: otherObjects
        } as DomainAction
      }
    } else {
      otherDomainAction = domainAction;
    }
    switch (domainAction.actionType) {
      case "DomainDataAction": {
        if (!!entityDomainAction) {
          if (!!otherDomainAction) {
            await this.handleDomainDataAction(entityDomainAction as DomainDataAction);
            return this.handleDomainDataAction(otherDomainAction as DomainDataAction);
          } else {
            return this.handleDomainDataAction(entityDomainAction as DomainDataAction);
          }
        } else {
          if (!!otherDomainAction) {
            return this.handleDomainDataAction(otherDomainAction as DomainDataAction);
          } else {
            return Promise.resolve()
          }
        }
      }
      case "DomainModelAction": {
        if (!!entityDomainAction) {
          if (!!otherDomainAction) {
            await this.handleDomainModelAction(entityDomainAction as DomainModelAction);
            return this.handleDomainModelAction(otherDomainAction as DomainModelAction);
          } else {
            return this.handleDomainModelAction(entityDomainAction as DomainModelAction);
          }
        } else {
          if (!!otherDomainAction) {
            return this.handleDomainModelAction(otherDomainAction as DomainModelAction);
          } else {
            return Promise.resolve()
          }
        }
        // return this.handleDomainModelAction(domainAction);
      }
      default:
        console.error(
          "DomainController handleDomainAction action could not be taken into account, unkown action",
          domainAction
        );
    }
  }
}
