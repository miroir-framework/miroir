import { ActionOrTestLogServiceInterface } from "../../3_controllers/MiroirLogService";
import { MiroirEventTrackerInterface } from "./MiroirEventTrackerInterface";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType";

export interface MiroirContextInterface {
  runActionOrTestTracker: MiroirEventTrackerInterface,
  actionOrTestLogService: ActionOrTestLogServiceInterface,
  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}