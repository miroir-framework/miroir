import { ErrorLogServiceInterface } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { MiroirConfigClient } from "../1_core/preprocessor-generated/miroirFundamentalType";

// }
export interface MiroirContextInterface {
  errorLogService:ErrorLogServiceInterface,
  getMiroirConfig(): MiroirConfigClient | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}