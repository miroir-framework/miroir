import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { ErrorLogServiceInterface } from "../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { ErrorLogService } from "./ErrorHandling/ErrorLogService";


export class MiroirContext implements MiroirContextInterface {
  public errorLogService:ErrorLogServiceInterface;

  constructor(
    // public errorLogService:ErrorLogServiceInterface,
  ){
    this.errorLogService = new ErrorLogService();
  }

}
