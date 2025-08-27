import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { ErrorLogServiceInterface } from "../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { RunActionTrackerInterface } from "../0_interfaces/3_controllers/RunActionTrackerInterface";
import { ErrorLogService } from "./ErrorHandling/ErrorLogService";
import { RunActionTracker } from "./RunActionTracker";
import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


export class MiroirContext implements MiroirContextInterface {
  public errorLogService:ErrorLogServiceInterface;
  public runActionTracker: RunActionTrackerInterface;

  constructor(
    public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined
  ){
    this.errorLogService = new ErrorLogService();
    this.runActionTracker = new RunActionTracker();
  }

  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined{
    return this.miroirConfig
  }
}
