import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { ErrorLogServiceInterface } from "../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { ErrorLogService } from "../3_controllers/ErrorLogService";


export class MiroirContext implements MiroirContextInterface {
  public errorLogService:ErrorLogServiceInterface;

  constructor(
    // public errorLogService:ErrorLogServiceInterface,
  ){
    this.errorLogService = new ErrorLogService();
  }

}
