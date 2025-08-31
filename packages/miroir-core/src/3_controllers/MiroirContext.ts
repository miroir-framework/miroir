import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { MiroirEventTrackerInterface } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import { LogInterceptor } from "../4_services/LogInterceptor";
import { MiroirLogService, ActionOrTestLogServiceInterface } from "./MiroirLogService";
import { MiroirActionOrTestTracker } from "./MiroirActionOrTestTracker";


export class MiroirContext implements MiroirContextInterface {
  public runActionOrTestTracker: MiroirEventTrackerInterface;
  public actionOrTestLogService: ActionOrTestLogServiceInterface;
  public logInterceptor: LogInterceptor;

  constructor(public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined) {
    // Create MiroirActionOrTestTracker that supports unified action and test tracking
    this.runActionOrTestTracker = new MiroirActionOrTestTracker();
    
    // Create MiroirLogService
    this.actionOrTestLogService = new MiroirLogService(this.runActionOrTestTracker);
    
    // Create unified log interceptor for action tracking only
    this.logInterceptor = new LogInterceptor({
      actionOrTest: {
        actionOrTestLogService: this.actionOrTestLogService,
        actionOrTestTracker: this.runActionOrTestTracker
      }
    });
    
    // Start intercepting logs
    this.logInterceptor.start();
  }

  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined {
    return this.miroirConfig;
  }
}
