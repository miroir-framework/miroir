import { z } from "zod";
import {
  domainNonTransactionalInstanceActionSchema,
  DomainTransactionalAction,
  domainTransactionalActionSchema,
  domainUndoRedoActionSchema,
  LocalCacheInfo
} from "../2_domain/DomainControllerInterface";

import {
  ActionReturnType,
  ApplicationSection,
  EntityInstanceCollection,
  instanceAction,
  InstanceAction,
  MetaModel,
  modelAction
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
export const LocalCacheInstanceActionWithDeploymentSchema = z.object(
  {
    actionType:z.literal("LocalCacheInstanceActionWithDeployment"),
    deploymentUuid: z.string().uuid(),
    instanceAction: instanceAction
  }
)

export type LocalCacheInstanceActionWithDeployment = z.infer<typeof LocalCacheInstanceActionWithDeploymentSchema>;

// ################################################################################################
export const localCacheUndoRedoActionSchema = domainUndoRedoActionSchema;

export type LocalCacheUndoRedoAction = z.infer<typeof localCacheUndoRedoActionSchema>;

// ################################################################################################
export const localCacheTransactionalActionSchema = z.union([
  // domainNonTransactionalInstanceActionSchema, // not only "transactional"?
  domainTransactionalActionSchema,
  domainUndoRedoActionSchema,
]);

export type LocalCacheTransactionalAction = z.infer<typeof localCacheTransactionalActionSchema>;

// ################################################################################################
export const LocalCacheUndoRedoActionWithDeploymentSchema = z.object({
  actionType:z.literal("localCacheUndoRedoActionWithDeployment"),
  deploymentUuid: z.string().uuid(),
  domainAction: localCacheUndoRedoActionSchema,
});
export type LocalCacheUndoRedoActionWithDeployment = z.infer<typeof LocalCacheUndoRedoActionWithDeploymentSchema>;

// ################################################################################################
export const LocalCacheTransactionalActionWithDeploymentSchema = z.object({
  actionType:z.literal("localCacheTransactionalActionWithDeployment"),
  deploymentUuid: z.string().uuid(),
  domainAction: localCacheTransactionalActionSchema,
});
export type LocalCacheTransactionalActionWithDeployment = z.infer<typeof LocalCacheTransactionalActionWithDeploymentSchema>;

// ################################################################################################
export const LocalCacheModelActionWithDeploymentSchema = z.object({
  actionType:z.literal("localCacheModelActionWithDeployment"),
  deploymentUuid: z.string().uuid(),
  modelAction: modelAction,
});
export type LocalCacheModelActionWithDeployment = z.infer<typeof LocalCacheModelActionWithDeploymentSchema>;

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
  currentTransaction():(DomainTransactionalAction | LocalCacheModelActionWithDeployment)[]; // any so as not to constrain implementation of cache and transaction mechanisms.

  // ##############################################################################################
  handleLocalCacheUndoRedoAction(action:LocalCacheUndoRedoActionWithDeployment):ActionReturnType;
  handleLocalCacheTransactionalAction(action:LocalCacheTransactionalActionWithDeployment):ActionReturnType;
  handleLocalCacheModelAction(action:LocalCacheModelActionWithDeployment):ActionReturnType;
  handleLocalCacheInstanceAction(action:LocalCacheInstanceActionWithDeployment):ActionReturnType;
  handleEndpointAction(action:InstanceAction):ActionReturnType;
}
