import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { MiroirEventTrackerInterface } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import { LogInterceptor } from "../4_services/LogInterceptor";
import { MiroirEventService, MiroirEventServiceInterface } from "./MiroirEventService";
import { MiroirEventTracker } from "./MiroirEventTracker";


export class MiroirContext implements MiroirContextInterface {
  public miroirEventTracker: MiroirEventTrackerInterface;
  public miroirEventService: MiroirEventServiceInterface;
  public logInterceptor: LogInterceptor;

  constructor(public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined) {
    // Create MiroirEventTracker that supports unified action and test tracking
    this.miroirEventTracker = new MiroirEventTracker();
    
    // Create MiroirEventService
    this.miroirEventService = new MiroirEventService(this.miroirEventTracker);
    
    // Create unified log interceptor for action tracking only
    this.logInterceptor = new LogInterceptor({
      eventHandlers: {
        actionOrTestLogService: this.miroirEventService,
        actionOrTestTracker: this.miroirEventTracker
      }
    });
    
    // Start intercepting logs
    this.logInterceptor.start();
  }

  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined {
    return this.miroirConfig;
  }
}
