import { InstanceAction } from "../1_core/preprocessor-generated/miroirFundamentalType.js";

export interface EndpointInterface {
  handleAction(action: InstanceAction): void,
  handleAsyncAction(action: InstanceAction): Promise<void>
}