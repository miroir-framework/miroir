import { z } from "zod";
import {
  LocalCacheInfo,
  UndoRedoActionNamesSchema
} from "../2_domain/DomainControllerInterface";

import {
  ActionReturnType,
  ApplicationSection,
  EntityInstanceCollection,
  InstanceAction,
  instanceCUDAction,
  MetaModel,
  modelAction
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
export const localCacheUndoRedoAction = z.object({
  actionType:z.literal("localCacheUndoRedoAction"),
  deploymentUuid: z.string().uuid(),
  undoRedoAction: UndoRedoActionNamesSchema,
});
export type LocalCacheUndoRedoAction = z.infer<typeof localCacheUndoRedoAction>;

// ################################################################################################
export const LocalCacheTransactionalInstanceActionWithDeploymentSchema = z.object({
  actionType:z.literal("localCacheTransactionalInstanceActionWithDeployment"),
  deploymentUuid: z.string().uuid(),
  instanceAction: instanceCUDAction
});
export type LocalCacheTransactionalInstanceActionWithDeployment = z.infer<typeof LocalCacheTransactionalInstanceActionWithDeploymentSchema>;

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
  currentTransaction():(LocalCacheTransactionalInstanceActionWithDeployment | LocalCacheModelActionWithDeployment)[]; // any so as not to constrain implementation of cache and transaction mechanisms.

  // ##############################################################################################
  handleLocalCacheUndoRedoAction(action:LocalCacheUndoRedoAction):ActionReturnType;
  handleLocalCacheTransactionalInstanceAction(action:LocalCacheTransactionalInstanceActionWithDeployment):ActionReturnType;
  handleLocalCacheModelAction(action:LocalCacheModelActionWithDeployment):ActionReturnType;
  handleLocalCacheInstanceAction(action:InstanceAction):ActionReturnType;
  handleEndpointAction(action:InstanceAction):ActionReturnType;
}
