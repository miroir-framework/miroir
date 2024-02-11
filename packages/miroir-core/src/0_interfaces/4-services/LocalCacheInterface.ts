import { z } from "zod";
import {
  DomainActionWithTransactionalEntityUpdateWithCUDUpdateSchema,
  LocalCacheInfo,
} from "../2_domain/DomainControllerInterface";

import {
  modelAction,
  instanceCUDAction,
  InstanceAction,
  ApplicationSection,
  EntityInstanceCollection,
  ActionReturnType,
  MetaModel,
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  DomainTransactionalActionWithCUDUpdate
} from "../2_domain/DomainControllerInterface.js";

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

// ################################################################################################
export const LocalCacheTransactionalActionSchema = z.union([
  DomainActionWithTransactionalEntityUpdateWithCUDUpdateSchema,
  modelAction,
]);
export type LocalCacheTransactionalAction = z.infer<typeof LocalCacheTransactionalActionSchema>;

// ################################################################################################
export const LocalCacheTransactionalActionWithDeploymentSchema = z.object({
  actionType:z.literal("localCacheTransactionalActionWithDeployment"),
  deploymentUuid: z.string().uuid(),
  domainAction: LocalCacheTransactionalActionSchema,
});
export type LocalCacheTransactionalActionWithDeployment = z.infer<typeof LocalCacheTransactionalActionWithDeploymentSchema>;

// ################################################################################################
export const LocalCacheEntityActionWithDeploymentSchema = z.object({
  actionType:z.literal("localCacheModelActionWithDeployment"),
  deploymentUuid: z.string().uuid(),
  modelAction: modelAction,
});
export type LocalCacheModelActionWithDeployment = z.infer<typeof LocalCacheEntityActionWithDeploymentSchema>;

export type CreateInstanceParameters = {
  deploymentUuid: string,
  applicationSection: ApplicationSection,
  objects: EntityInstanceCollection[],
};

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
  currentTransaction():(DomainTransactionalActionWithCUDUpdate | LocalCacheModelActionWithDeployment)[]; // any so as not to constrain implementation of cache and transaction mechanisms.

  // actions on local cache
  createInstance(
    deploymentUuid: string,
    applicationSection: ApplicationSection,
    objects: EntityInstanceCollection[],
  ): ActionReturnType;

  // ##############################################################################################
  handleLocalCacheTransactionalAction(action:LocalCacheTransactionalActionWithDeployment):ActionReturnType;
  handleLocalCacheModelAction(action:LocalCacheModelActionWithDeployment):ActionReturnType;
  handleLocalCacheCUDAction(action:LocalCacheCUDActionWithDeployment):ActionReturnType;
  handleEndpointAction(action:InstanceAction):ActionReturnType;
}
