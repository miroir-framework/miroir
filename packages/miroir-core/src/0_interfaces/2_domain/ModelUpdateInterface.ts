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
export const EntityInstanceTransactionalCUDUpdateSchema = z.object({
  actionType: z.literal("EntityInstanceTransactionalCUDUpdate"),
  actionName: CUDActionNameSchema,
  objects: z.array(entityInstanceCollection),
});
export type EntityInstanceTransactionalCUDUpdate = z.infer<typeof EntityInstanceTransactionalCUDUpdateSchema>;

// #############################################################################################
export const WrappedTransactionalModelActionEntityUpdateSchema = z.object({
  actionName: z.literal("WrappedTransactionalModelActionEntityUpdate"),
  modelEntityUpdate: ModelActionEntityUpdateSchema,
});
export type WrappedTransactionalModelActionEntityUpdate = z.infer<typeof WrappedTransactionalModelActionEntityUpdateSchema>;

// // #############################################################################################
// export const WrappedTransactionalEntityUpdateWithCUDUpdateSchema = z.object({
//   actionName: z.literal("WrappedTransactionalEntityUpdateWithCUDUpdate"),
//   modelEntityUpdate: ModelActionEntityUpdateSchema,
//   equivalentModelCUDUpdates: z.array(EntityInstanceTransactionalCUDUpdateSchema),
// });
// export type WrappedTransactionalEntityUpdateWithCUDUpdate = z.infer<
//   typeof WrappedTransactionalEntityUpdateWithCUDUpdateSchema
// >;

// // #############################################################################################
// export const ModelUpdateSchema = z.union([WrappedTransactionalModelActionEntityUpdateSchema, EntityInstanceTransactionalCUDUpdateSchema]);
// export type ModelUpdate = z.infer<typeof ModelUpdateSchema>;

// // #############################################################################################
// export const ModelReplayableUpdateSchema = z.union([
//   WrappedTransactionalEntityUpdateWithCUDUpdateSchema,
//   EntityInstanceTransactionalCUDUpdateSchema,
// ]);
// export type ModelReplayableUpdate = z.infer<typeof ModelReplayableUpdateSchema>;
