import { ErrorLogServiceInterface } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface.js";
import { MiroirConfigClient } from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// }
export interface MiroirContextInterface {
  errorLogService:ErrorLogServiceInterface,
  getMiroirConfig(): MiroirConfigClient | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}