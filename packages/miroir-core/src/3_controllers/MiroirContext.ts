import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { ErrorLogServiceInterface } from "../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { ErrorLogService } from "./ErrorHandling/ErrorLogService";
import { MiroirConfig } from "../0_interfaces/1_core/MiroirConfig";


export class MiroirContext implements MiroirContextInterface {
  public errorLogService:ErrorLogServiceInterface;

  constructor(
    // public errorLogService:ErrorLogServiceInterface,
    public miroirConfig: MiroirConfig | undefined
  ){
    this.errorLogService = new ErrorLogService();
  }

  getMiroirConfig(): MiroirConfig | undefined{
    return this.miroirConfig
  }
}
