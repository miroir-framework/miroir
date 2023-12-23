import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { ErrorLogServiceInterface } from "../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { ErrorLogService } from "./ErrorHandling/ErrorLogService";
import { MiroirConfigClient } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


export class MiroirContext implements MiroirContextInterface {
  public errorLogService:ErrorLogServiceInterface;

  constructor(
    public miroirConfig: MiroirConfigClient | undefined
  ){
    this.errorLogService = new ErrorLogService();
  }

  getMiroirConfig(): MiroirConfigClient | undefined{
    return this.miroirConfig
  }
}
