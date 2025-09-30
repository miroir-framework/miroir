import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { MiroirActivityTrackerInterface } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { MiroirEventService } from "./MiroirEventService";
// import { TransformerEventService } from "./TransformerEventService";


export class MiroirContext implements MiroirContextInterface {
  
  constructor(
    public miroirActivityTracker: MiroirActivityTrackerInterface,
    public miroirEventService: MiroirEventService,
    public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined
  ) {
  }

  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined {
    return this.miroirConfig;
  }
}
