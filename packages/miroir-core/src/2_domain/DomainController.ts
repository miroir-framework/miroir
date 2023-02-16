import { InstanceCollection } from "../0_interfaces/1_core/Instance";
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

  handleDomainAction(domainAction:DomainAction){
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainAction',domainAction);
    if (CRUDActionNamesArray.map(a=>a.toString()).includes(domainAction.actionName)) {
      domainAction.objects.forEach(
        (instances:InstanceCollection) => {
          console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ DomainController handleDomainAction handling instances',instances);
          this.dataController.handleRemoteStoreAction({
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
      );
    } else {
      console.warn('DomainController handleDomainAction',domainAction);
    }
  };

}