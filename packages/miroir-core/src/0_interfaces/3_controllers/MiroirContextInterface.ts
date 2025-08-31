import { MiroirEventServiceInterface } from "../../3_controllers/MiroirEventService";
import { MiroirEventTrackerInterface } from "./MiroirEventTrackerInterface";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType";
import { TransformerEventServiceInterface } from "./TransformerEventInterface";

export interface MiroirContextInterface {
  miroirEventTracker: MiroirEventTrackerInterface,
  miroirEventService: MiroirEventServiceInterface,
  transformerEventService: TransformerEventServiceInterface,
  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}