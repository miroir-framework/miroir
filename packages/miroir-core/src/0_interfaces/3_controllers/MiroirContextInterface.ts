import { ActionLogServiceInterface } from "../../3_controllers/ActionLogService";
import { TestLogServiceInterface } from "../../3_controllers/TestLogService";
import { ErrorLogServiceInterface } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { RunActionTrackerInterface } from "../../0_interfaces/3_controllers/RunActionTrackerInterface";
import { TestTrackerInterface } from "../../0_interfaces/3_controllers/TestTrackerInterface";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType";

export interface MiroirContextInterface {
  // errorLogService:ErrorLogServiceInterface,
  runActionTracker: RunActionTrackerInterface,
  actionLogService: ActionLogServiceInterface,
  testTracker: TestTrackerInterface,
  testLogService: TestLogServiceInterface,
  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}