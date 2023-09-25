import { z } from "zod";

import { jzodReference } from "@miroir-framework/jzod-ts";
import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance.js";

export const jzodSchemaDefinitionSchema = EntityInstanceWithNameSchema.extend({
  description: z.string().optional(),
  defaultLabel: z.string().optional(),
  definition: jzodReference,
});
export type JzodSchemaDefinition = z.infer<typeof jzodSchemaDefinitionSchema>;