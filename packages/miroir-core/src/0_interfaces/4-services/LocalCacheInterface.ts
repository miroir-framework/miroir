import { z } from "zod";
import {
  LocalCacheInfo
} from "../2_domain/DomainControllerInterface";

import {
  ActionReturnType,
  instanceCUDAction,
  LocalCacheAction,
  MetaModel,
  ModelAction
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
export const LocalCacheTransactionalInstanceActionWithDeploymentSchema = z.object({
  actionType:z.literal("localCacheTransactionalInstanceActionWithDeployment"),
  deploymentUuid: z.string().uuid(),
  instanceAction: instanceCUDAction
});
export type LocalCacheTransactionalInstanceActionWithDeployment = z.infer<typeof LocalCacheTransactionalInstanceActionWithDeploymentSchema>;

// ################################################################################################
/**
 * Decorator to the Redux Store, handing specific Miroir entity slices
 */
export declare interface LocalCacheInterface
{
  // constructor
  run(): void;
  // view of current data state & transaction
  getInnerStore(): any; // TODO: local store should not expose its implementation!!
  getState(): any; // TODO: local store should not directly expose its internal state!!
  currentInfo(): LocalCacheInfo;
  currentModel(deploymentUuid:string): MetaModel;
  currentTransaction():(LocalCacheTransactionalInstanceActionWithDeployment | ModelAction)[]; // any so as not to constrain implementation of cache and transaction mechanisms.

  // ##############################################################################################
  handleAction(action:LocalCacheAction):ActionReturnType;
}
