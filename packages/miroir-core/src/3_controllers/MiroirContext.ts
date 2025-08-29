import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { RunActionTrackerInterface } from "../0_interfaces/3_controllers/RunActionTrackerInterface";
import { ActionLogInterceptor } from "../4_services/ActionLogInterceptor";
import { ActionLogService, ActionLogServiceInterface } from "./ActionLogService";
import { RunActionTracker } from "./RunActionTracker";


export class MiroirContext implements MiroirContextInterface {
  // public errorLogService:ErrorLogServiceInterface;
  public runActionTracker: RunActionTrackerInterface;
  public actionLogService: ActionLogServiceInterface;
  public actionLogInterceptor: ActionLogInterceptor;

  constructor(
    public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined
  ){
    // this.errorLogService = new ErrorLogService();
    this.runActionTracker = new RunActionTracker();
    this.actionLogService = new ActionLogService(this.runActionTracker);
    this.actionLogInterceptor = new ActionLogInterceptor(this.actionLogService, this.runActionTracker);
    
    // Start intercepting logs for action tracking
    this.actionLogInterceptor.start();
  }

  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined{
    return this.miroirConfig
  }
}
