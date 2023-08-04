import { z } from "zod";

import { jzodObjectSchema } from "@miroir-framework/jzod";
import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance.js";

export const jzodSchemaDefinitionSchema = EntityInstanceWithNameSchema.extend({
  description: z.string().optional(),
  defaultLabel: z.string().optional(),
  definition: jzodObjectSchema,
});
export type JzodSchemaDefinition = z.infer<typeof jzodSchemaDefinitionSchema>;