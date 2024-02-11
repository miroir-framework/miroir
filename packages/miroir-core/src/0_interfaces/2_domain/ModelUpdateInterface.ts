import { z } from "zod";
import { EntityAttributePartialSchema, MetaEntitySchema } from "../../0_interfaces/1_core/EntityDefinition.js";
import {
  entityDefinition,
  entityInstanceCollection,
  modelActionDropEntity,
  modelActionRenameEntity,
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// #############################################################################################
export const CUDActionNamesArray = ["create", "update", "delete"] as const;
export const CUDActionNameSchema = z.enum(CUDActionNamesArray);

export type CUDActionName = z.infer<typeof CUDActionNameSchema>;

// #############################################################################################
export const ModelEntityUpdateCreateMetaModelInstanceSchema = z.object({
  actionType: z.literal("ModelEntityUpdate"),
  actionName: z.literal("createEntity"),
  entities: z.array(
    z.object({
      entity: MetaEntitySchema,
      entityDefinition: entityDefinition,
    })
  ),
});
export type ModelEntityUpdateCreateMetaModelInstance = z.infer<typeof ModelEntityUpdateCreateMetaModelInstanceSchema>;

// #############################################################################################
export const ModelEntityUpdateAlterEntityAttributeSchema = z.object({
  actionType: z.literal("ModelEntityUpdate"),
  actionName: z.literal("alterEntityAttribute"),
  parentName: z.string().optional(),
  parentUuid: z.string(),
  entityAttributeId: z.number(),
  update: EntityAttributePartialSchema,
});
export type ModelEntityUpdateAlterEntityAttribute = z.infer<typeof ModelEntityUpdateAlterEntityAttributeSchema>;

// // #############################################################################################
// export const ModelEntityUpdateDeleteMetaModelInstanceSchema = z.object({
//   actionType: z.literal('ModelEntityUpdate'),
//   actionName: z.literal('DeleteEntity'),
//   entityName:z.string().optional(),
//   entityUuid:z.string(),
// });
// export type ModelEntityUpdateDeleteMetaModelInstance = z.infer<typeof ModelEntityUpdateDeleteMetaModelInstanceSchema>;

// // #############################################################################################
// export const ModelEntityUpdateRenameEntitySchema = z.object({
//   actionType: z.literal('ModelEntityUpdate'),
//   actionName: z.literal('renameEntity'),
//   entityName:z.string().optional(),
//   entityUuid:z.string(),
//   entityAttributeName:z.string().optional(),
//   targetValue:z.any().optional(),
// });
// export type ModelEntityUpdateRenameEntity = z.infer<typeof ModelEntityUpdateRenameEntitySchema>;

// #############################################################################################
export const ModelEntityUpdateSchema = z.union([
  ModelEntityUpdateCreateMetaModelInstanceSchema,
  ModelEntityUpdateAlterEntityAttributeSchema,
  // ModelEntityUpdateDeleteMetaModelInstanceSchema,
  // ModelEntityUpdateRenameEntitySchema,
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
