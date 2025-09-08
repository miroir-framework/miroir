import { type MiroirEventService } from "../../3_controllers/MiroirEventService";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirEventTrackerInterface } from "./MiroirEventTrackerInterface";
import { TransformerEventServiceInterface } from "./TransformerEventInterface";

export interface MiroirContextInterface {
  miroirEventTracker: MiroirEventTrackerInterface,
  miroirEventService: MiroirEventService,
  // transformerEventService: TransformerEventServiceInterface,
  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}