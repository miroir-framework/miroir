import { z } from "zod";
import {
  entityAttributePartial,
  entityInstanceCollection,
  modelActionCreateEntity,
  modelActionDropEntity,
  modelActionRenameEntity
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// #############################################################################################
export const CUDActionNamesArray = ["create", "update", "delete"] as const;
export const CUDActionNameSchema = z.enum(CUDActionNamesArray);

export type CUDActionName = z.infer<typeof CUDActionNameSchema>;

// #############################################################################################
export const ModelEntityUpdateAlterEntityAttributeSchema = z.object({
  actionType: z.literal("ModelEntityUpdate"),
  actionName: z.literal("alterEntityAttribute"),
  parentName: z.string().optional(),
  parentUuid: z.string(),
  entityAttributeId: z.number(),
  update: entityAttributePartial,
  // update: EntityAttributePartialSchema,
});
export type ModelEntityUpdateAlterEntityAttribute = z.infer<typeof ModelEntityUpdateAlterEntityAttributeSchema>;

// #############################################################################################
export const ModelEntityUpdateSchema = z.union([
  ModelEntityUpdateAlterEntityAttributeSchema,
  // modelActionAlterEntityAttribute,
  modelActionCreateEntity,
  modelActionRenameEntity,
  modelActionDropEntity,
]);
export type ModelEntityUpdate = z.infer<typeof ModelEntityUpdateSchema>;

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
  modelEntityUpdate: ModelEntityUpdateSchema,
});
export type WrappedTransactionalEntityUpdate = z.infer<typeof WrappedTransactionalEntityUpdateSchema>;

// #############################################################################################
export const WrappedTransactionalEntityUpdateWithCUDUpdateSchema = z.object({
  actionName: z.literal("WrappedTransactionalEntityUpdateWithCUDUpdate"),
  modelEntityUpdate: ModelEntityUpdateSchema,
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
