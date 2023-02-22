import { CRUDActionName, CRUDActionNamesArray, DomainAction } from "../0_interfaces/2_domain/DomainLanguageInterface";
import { DomainActionInterface } from "../0_interfaces/2_domain/instanceDomainInterface";
import { DataControllerInterface } from "../0_interfaces/3_controllers/DataControllerInterface";

/**
 * domain level contains "business" logic related to concepts defined whithin the
 * application: entities, reports, reducers, users, etc.
 * example: get the list of reports accessible by a given user.
 */
export class DomainController implements DomainActionInterface {
  constructor(
    private dataController: DataControllerInterface
  ){

  }

  async handleDomainAction(domainAction:DomainAction):Promise<void>{
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainAction',domainAction);
    if (CRUDActionNamesArray.map(a=>a.toString()).includes(domainAction.actionName)) {
      // domainAction.objects.forEach(
        for (const instances of domainAction.objects) {
        // async (instances:InstanceCollection) => {
          console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainAction handling instances',instances);
          await this.dataController.handleRemoteStoreAction({
            // actionName: domainActionToCRUDAction(domainAction.actionName),
            actionName: domainAction.actionName.toString() as CRUDActionName,
            entityName: instances.entity,
            objects: instances.instances
          });
          this.dataController.handleLocalCacheAction(
            domainAction
            // {
            //   actionName: domainActionToCRUDAction(action.actionName),
            //   objects: instances
            // }
          );
        }

        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainAction end',domainAction);

    } else {
      console.warn('DomainController handleDomainAction',domainAction);
    }
    return Promise.resolve()
  };

}