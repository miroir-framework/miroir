import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { MiroirActivityTrackerInterface } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import { ConsoleInterceptor } from "../4_services/ConsoleInterceptor";
import { MiroirActivityTracker } from "./MiroirActivityTracker";
import { MiroirEventService } from "./MiroirEventService";
// import { TransformerEventService } from "./TransformerEventService";


export class MiroirContext implements MiroirContextInterface {
  public miroirActivityTracker: MiroirActivityTrackerInterface;
  public miroirEventService: MiroirEventService;
  // public transformerEventService: TransformerEventServiceInterface;
  public logInterceptor: ConsoleInterceptor;

  constructor(public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined) {
    // Create MiroirActivityTracker that supports unified action and test tracking
    this.miroirActivityTracker = new MiroirActivityTracker();
    
    // Create MiroirEventService
    this.miroirEventService = new MiroirEventService(this.miroirActivityTracker);

    // this.miroirActivityTracker.setMiroirEventService(this.miroirEventService); // redundant as done in MiroirEventService constructor
    
    // Create unified log interceptor for action tracking only
    this.logInterceptor = new ConsoleInterceptor({
      eventHandlers: {
        actionOrTestLogService: this.miroirEventService,
        actionOrTestTracker: this.miroirActivityTracker
      }
    });
    
    // Start intercepting logs
    this.logInterceptor.start();
  }

  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined {
    return this.miroirConfig;
  }
}
