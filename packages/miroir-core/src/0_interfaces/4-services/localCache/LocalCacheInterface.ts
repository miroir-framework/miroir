import { z } from "zod";
import {
  DomainActionWithTransactionalEntityUpdateWithCUDUpdateSchema,
  LocalCacheInfo,
} from "../../../0_interfaces/2_domain/DomainControllerInterface";
import { MiroirApplicationModel } from '../../1_core/Model.js';

import { actionModelerParams, instanceCUDAction } from '../../1_core/preprocessor-generated/miroirFundamentalType.js';
import {
  DomainTransactionalActionWithCUDUpdate
} from "../../2_domain/DomainControllerInterface.js";

// ################################################################################################

export const LocalCacheActionWithDeploymentSchema = z.object(
  {
    actionType:z.literal("LocalCacheCUDActionWithDeployment"),
    deploymentUuid: z.string().uuid(),
    instanceCUDAction: instanceCUDAction
  }
)

export type LocalCacheCUDActionWithDeployment = z.infer<typeof LocalCacheActionWithDeploymentSchema>;
// export interface LocalCacheCUDActionWithDeployment {
//   deploymentUuid: Uuid,
//   instanceCUDAction: InstanceCUDAction,
// }

export const LocalCacheTransactionalActionSchema = z.union([
  DomainActionWithTransactionalEntityUpdateWithCUDUpdateSchema,
  actionModelerParams,
]);
export type LocalCacheTransactionalAction = z.infer<typeof LocalCacheTransactionalActionSchema>;

export const LocalCacheTransactionalActionWithDeploymentSchema = z.object({
  actionType:z.literal("localCacheTransactionalActionWithDeployment"),
  deploymentUuid: z.string().uuid(),
  domainAction: LocalCacheTransactionalActionSchema,
});
export type LocalCacheTransactionalActionWithDeployment = z.infer<typeof LocalCacheTransactionalActionWithDeploymentSchema>;

export const LocalCacheEntityActionWithDeploymentSchema = z.object({
  actionType:z.literal("localCacheEntityActionWithDeployment"),
  deploymentUuid: z.string().uuid(),
  entityAction: actionModelerParams,
});
export type LocalCacheEntityActionWithDeployment = z.infer<typeof LocalCacheEntityActionWithDeploymentSchema>;

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
  currentModel(deploymentUuid:string): MiroirApplicationModel;
  currentTransaction():(DomainTransactionalActionWithCUDUpdate | LocalCacheEntityActionWithDeployment)[]; // any so as not to constrain implementation of cache and transaction mechanisms.
  // actions on local cache
  handleLocalCacheTransactionalAction(action:LocalCacheTransactionalActionWithDeployment):void;
  handleLocalCacheEntityAction(action:LocalCacheEntityActionWithDeployment):void;
  handleLocalCacheCUDAction(action:LocalCacheCUDActionWithDeployment):void;
}
