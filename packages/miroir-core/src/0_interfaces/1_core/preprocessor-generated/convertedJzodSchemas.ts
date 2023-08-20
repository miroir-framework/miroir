import { ZodType, ZodTypeAny, z } from "zod";
import { jzodElementSchema, jzodObjectSchema } from "@miroir-framework/jzod";

export const entityDefinitionEntityDefinitionZodSchema = z.object({
  uuid: z.string().uuid(),
  parentName: z.string(),
  parentUuid: z.string().uuid(),
  name: z.string(),
  conceptLevel: z.enum(["MetaModel", "Model", "Data"] as any).optional(),
  description: z.string().optional(),
  jzodSchema: z.lazy(() => jzodObjectSchema.optional()),
});
export type entityDefinitionEntityDefinition = z.infer<typeof entityDefinitionEntityDefinitionZodSchema>;
