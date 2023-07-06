import { ZodType, ZodTypeAny, z } from "zod";
import { jzodElementSchema, jzodObjectSchema } from "@miroir-framework/jzod";

export const entityDefinitionEntityDefinitionZodSchema = z.object({
  uuid: z.string().uuid(),
  parentName: z.string(),
  parentUuid: z.string().uuid(),
  name: z.string(),
  conceptLevel: z.enum(["MetaModel", "Model", "Data"] as any),
  description: z.string(),
  jzodSchema: z.lazy(() => jzodObjectSchema),
  attributes: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      defaultLabel: z.string(),
      type: z.string(),
      nullable: z.boolean(),
      editable: z.boolean(),
      lineFormat: z.any().optional(),
    })
  ),
  attributesNew: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        defaultLabel: z.string(),
        jzodSchema: z.lazy(() => jzodElementSchema),
        entityUuid: z.string().uuid().optional(),
        nullable: z.boolean().optional(),
        editable: z.boolean().optional(),
      })
    )
    .optional(),
});
export type entityDefinitionEntityDefinition = z.infer<typeof entityDefinitionEntityDefinitionZodSchema>;
