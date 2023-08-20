import { ZodType, ZodTypeAny, z } from "zod"
import { jzodElementSchema, jzodObjectSchema } from "@miroir-framework/jzod"

export const entityDefinitionReportZodSchema = z.object({
  uuid: z.string().uuid(),
  parentName: z.string().optional(),
  parentUuid: z.string().uuid(),
  conceptLevel: z.enum(["MetaModel", "Model", "Data"] as any).optional(),
  name: z.string(),
  defaultLabel: z.string(),
  type: z.string().optional(),
  application: z.string().uuid().optional(),
  definition: z.string(),
})
export type entityDefinitionReport = z.infer<
  typeof entityDefinitionReportZodSchema
>
