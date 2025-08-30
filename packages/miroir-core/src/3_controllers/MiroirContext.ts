import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { RunActionTrackerInterface } from "../0_interfaces/3_controllers/RunActionTrackerInterface";
import { LogInterceptor } from "../4_services/LogInterceptor";
import { ActionLogService, ActionLogServiceInterface } from "./ActionLogService";
import { RunActionTracker } from "./RunActionTracker";


export class MiroirContext implements MiroirContextInterface {
  public runActionTracker: RunActionTrackerInterface;
  public actionLogService: ActionLogServiceInterface;
  public logInterceptor: LogInterceptor;

  constructor(public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined) {
    // Create RunActionTracker that supports unified action and test tracking
    this.runActionTracker = new RunActionTracker();
    
    // Create ActionLogService
    this.actionLogService = new ActionLogService(this.runActionTracker);
    
    // Create unified log interceptor for action tracking only
    this.logInterceptor = new LogInterceptor({
      action: {
        actionLogService: this.actionLogService,
        runActionTracker: this.runActionTracker
      }
    });
    
    // Start intercepting logs
    this.logInterceptor.start();
  }

  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined {
    return this.miroirConfig;
  }
}
