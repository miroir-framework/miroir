import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { MiroirActivityTrackerInterface } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { MiroirEventService } from "./MiroirEventService";


/**
 * The activity tracker and event service of a host, shared by its controllers.
 * @public
 */
export class MiroirContext implements MiroirContextInterface {
  
  constructor(
    public miroirActivityTracker: MiroirActivityTrackerInterface,
    public miroirEventService: MiroirEventService,
    public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined
  ) {
  }

  extendMiroirConfigWithExtraDeploymentConfiguration(): MiroirConfigClient | MiroirConfigServer | undefined {
    return this.miroirConfig;
  }
}
