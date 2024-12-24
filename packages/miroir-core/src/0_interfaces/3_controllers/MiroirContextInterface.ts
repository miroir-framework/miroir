import { ErrorLogServiceInterface } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface.js";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType.js";

export interface MiroirContextInterface {
  errorLogService:ErrorLogServiceInterface,
  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}