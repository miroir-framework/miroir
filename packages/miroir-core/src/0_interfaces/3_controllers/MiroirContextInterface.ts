import { ErrorLogServiceInterface } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType";

export interface MiroirContextInterface {
  errorLogService:ErrorLogServiceInterface,
  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}