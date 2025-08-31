import { MiroirEventServiceInterface } from "../../3_controllers/MiroirEventService";
import { MiroirEventTrackerInterface } from "./MiroirEventTrackerInterface";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType";

export interface MiroirContextInterface {
  miroirEventTracker: MiroirEventTrackerInterface,
  miroirEventService: MiroirEventServiceInterface,
  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}