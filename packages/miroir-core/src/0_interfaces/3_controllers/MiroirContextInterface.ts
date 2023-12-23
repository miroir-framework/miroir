import { ErrorLogServiceInterface } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { MiroirConfigClient } from "../1_core/MiroirConfig";

// }
export interface MiroirContextInterface {
  errorLogService:ErrorLogServiceInterface,
  // domainController: DomainControllerInterface;
  getMiroirConfig(): MiroirConfigClient | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}