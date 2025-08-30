import { ActionLogServiceInterface } from "../../3_controllers/ActionLogService";
import { RunActionTrackerInterface } from "../../0_interfaces/3_controllers/RunActionTrackerInterface";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType";

export interface MiroirContextInterface {
  runActionTracker: RunActionTrackerInterface,
  actionLogService: ActionLogServiceInterface,
  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}