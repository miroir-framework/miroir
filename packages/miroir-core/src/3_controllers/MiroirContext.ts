import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { MiroirEventTrackerInterface } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import { TransformerEventServiceInterface } from "../0_interfaces/3_controllers/TransformerEventInterface";
import { ConsoleInterceptor } from "../4_services/ConsoleInterceptor";
import { TransformerGlobalContext } from "../4_services/TransformerContext";
import { MiroirEventService, MiroirEventServiceInterface } from "./MiroirEventService";
import { MiroirEventTracker } from "./MiroirEventTracker";
import { TransformerEventService } from "./TransformerEventService";


export class MiroirContext implements MiroirContextInterface {
  public miroirEventTracker: MiroirEventTrackerInterface;
  public miroirEventService: MiroirEventServiceInterface;
  public transformerEventService: TransformerEventServiceInterface;
  public logInterceptor: ConsoleInterceptor;

  constructor(public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined) {
    // Create MiroirEventTracker that supports unified action and test tracking
    this.miroirEventTracker = new MiroirEventTracker();
    
    // Set the global transformer context
    TransformerGlobalContext.setEventTracker(this.miroirEventTracker);
    
    // Create MiroirEventService
    this.miroirEventService = new MiroirEventService(this.miroirEventTracker);
    
    // Create TransformerEventService
    this.transformerEventService = new TransformerEventService(this.miroirEventService, this.miroirEventTracker);
    
    // Create unified log interceptor for action tracking only
    this.logInterceptor = new ConsoleInterceptor({
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
