import { DomainAction } from "../../0_interfaces/2_domain/DomainLanguageInterface";

export interface DomainActionInterface {
  handleDomainAction(action:DomainAction);
}


export default {}