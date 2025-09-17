import { type MiroirEventService } from "../../3_controllers/MiroirEventService";
import type { ConsoleInterceptor } from "../../4_services/ConsoleInterceptor";
import { MiroirConfigClient, MiroirConfigServer } from "../1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirActivityTrackerInterface } from "./MiroirEventTrackerInterface";
import { TransformerEventServiceInterface } from "./TransformerEventInterface";

export interface MiroirContextInterface {
  miroirEventTracker: MiroirActivityTrackerInterface,
  miroirEventService: MiroirEventService,
  logInterceptor: ConsoleInterceptor,
  // transformerEventService: TransformerEventServiceInterface,
  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined,
}

export interface MiroirContextServiceInterface {
  
}

export default {}