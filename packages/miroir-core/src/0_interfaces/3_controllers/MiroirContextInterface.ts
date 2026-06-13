import { type MiroirEventService } from "../../3_controllers/MiroirEventService";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirActivityTrackerInterface } from "./MiroirActivityTrackerInterface";
import { TransformerEventServiceInterface } from "./TransformerEventInterface";

export interface MiroirContextInterface {
  miroirActivityTracker: MiroirActivityTrackerInterface,
  miroirEventService: MiroirEventService,
  extendMiroirConfigWithExtraDeploymentConfiguration(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}