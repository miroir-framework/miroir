import { z } from "zod";
import {
  entityInstanceCollection,
  modelActionAlterEntityAttribute,
  modelActionCreateEntity,
  modelActionDropEntity,
  modelActionRenameEntity
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// #############################################################################################
export const CUDActionNamesArray = ["create", "update", "delete"] as const;
export const CUDActionNameSchema = z.enum(CUDActionNamesArray);

export type CUDActionName = z.infer<typeof CUDActionNameSchema>;

// #############################################################################################
export const ModelActionEntityUpdateSchema = z.union([
  modelActionAlterEntityAttribute,
  modelActionCreateEntity,
  modelActionRenameEntity,
  modelActionDropEntity,
]);
export type ModelActionEntityUpdate = z.infer<typeof ModelActionEntityUpdateSchema>;

// #############################################################################################
export const ModelCUDInstanceUpdateSchema = z.object({
  actionType: z.literal("ModelEntityInstanceCUDUpdate"),
  actionName: CUDActionNameSchema,
  objects: z.array(entityInstanceCollection),
});
export type ModelEntityInstanceCUDUpdate = z.infer<typeof ModelCUDInstanceUpdateSchema>;

// #############################################################################################
export const WrappedTransactionalEntityUpdateSchema = z.object({
  actionName: z.literal("WrappedTransactionalEntityUpdate"),
  modelEntityUpdate: ModelActionEntityUpdateSchema,
});
export type WrappedTransactionalEntityUpdate = z.infer<typeof WrappedTransactionalEntityUpdateSchema>;

// #############################################################################################
export const WrappedTransactionalEntityUpdateWithCUDUpdateSchema = z.object({
  actionName: z.literal("WrappedTransactionalEntityUpdateWithCUDUpdate"),
  modelEntityUpdate: ModelActionEntityUpdateSchema,
  equivalentModelCUDUpdates: z.array(ModelCUDInstanceUpdateSchema),
});
export type WrappedTransactionalEntityUpdateWithCUDUpdate = z.infer<
  typeof WrappedTransactionalEntityUpdateWithCUDUpdateSchema
>;

// #############################################################################################
export const ModelUpdateSchema = z.union([WrappedTransactionalEntityUpdateSchema, ModelCUDInstanceUpdateSchema]);
export type ModelUpdate = z.infer<typeof ModelUpdateSchema>;

// #############################################################################################
export const ModelReplayableUpdateSchema = z.union([
  WrappedTransactionalEntityUpdateWithCUDUpdateSchema,
  ModelCUDInstanceUpdateSchema,
]);
export type ModelReplayableUpdate = z.infer<typeof ModelReplayableUpdateSchema>;
