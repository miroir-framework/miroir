import { z } from "zod";
import { entityInstance, type JzodElement } from "../1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
export const jzodEntityIdSchema: JzodElement = {
  type: "union",
  definition: [
    { type: "number" },
    { type: "uuid" }
  ]
}
export const zEntityIdSchema = z.union([z.number(), z.string()]);

// ################################################################################################
export const jzodDictionarySchema: JzodElement = {
  type: "record",
  definition: {
    type: "schemaReference",
    definition: {
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      relativePath: "entityInstance"
    }
  }
}
export const zDictionarySchema = z.record(z.string().uuid(), entityInstance);
export type MiroirDictionary = z.infer<typeof zDictionarySchema>;

// ################################################################################################
// #214 Option C′ — segment header sits beside EntityAdapter ids/entities (not per instance).
export const jzodLocalCacheSegmentHeaderSchema: JzodElement = {
  type: "object",
  definition: {
    kind: { type: "enum", definition: ["full", "partial"] },
    freshness: { type: "enum", definition: ["fresh", "stale"] },
    projection: {
      type: "array",
      optional: true,
      definition: { type: "string" },
    },
  },
};
export const zLocalCacheSegmentHeaderSchema = z.object({
  kind: z.enum(["full", "partial"]),
  freshness: z.enum(["fresh", "stale"]),
  projection: z.array(z.string()).optional(),
});

// ################################################################################################
export const jzodEntityStateSchema: JzodElement = {
  type: "object",
  definition: {
    ids: { type: "array", definition: { type: "string" } },
    entities: jzodDictionarySchema,
    segment: { ...jzodLocalCacheSegmentHeaderSchema, optional: true },
  }
}
export const zEntityStateSchema = z.object({
  ids: z.array(z.string()),
  entities: zDictionarySchema,
  segment: zLocalCacheSegmentHeaderSchema.optional(),
});
export type ZEntityState = z.infer<typeof zEntityStateSchema>; //not used

// ################################################################################################
export const jzodReduxDeploymentState: JzodElement = {
  type: "record",
  definition: jzodEntityStateSchema
  // definition: {
  //   type: "schemaReference",
  //   definition: {
  //     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //     relativePath: "zEntityStateSchema"
  //   }
  // }
}
export type ReduxDeploymentsState = { [DeploymentUuidSectionEntityUuid: string]: ZEntityState };
