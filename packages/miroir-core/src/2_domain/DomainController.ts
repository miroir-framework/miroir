import { CRUDActionName, CRUDActionNamesArray, DomainAction, DomainControllerInterface } from "../0_interfaces/2_domain/DomainControllerInterface";
import { DataControllerInterface } from "../0_interfaces/3_controllers/DataControllerInterface";

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

  currentTransaction():any[]{
    return this.dataController.currentLocalCacheTransaction();
  };

  async handleDomainAction(domainAction:DomainAction):Promise<void>{
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainAction',domainAction);
    if (CRUDActionNamesArray.map(a=>a.toString()).includes(domainAction.actionName)) {
        for (const instances of domainAction.objects) { // TODO: replace with parallel implementation Promise.all?
          console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainAction handling instances',instances);
          await this.dataController.handleRemoteStoreAction({
            actionName: domainAction.actionName.toString() as CRUDActionName,
            entityName: instances.entity,
            objects: instances.instances
          });
          this.dataController.handleLocalCacheAction(
            domainAction
          );
        }

        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainAction end',domainAction);

    } else {
      console.warn('DomainController handleDomainAction',domainAction);
    }
    return Promise.resolve()
  };

}