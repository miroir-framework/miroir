import { z } from "zod";

import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance";
import { jzodReference } from "./preprocessor-generated/miroirFundamentalType";

export const jzodSchemaDefinitionSchema = EntityInstanceWithNameSchema.extend({
  description: z.string().optional(),
  defaultLabel: z.string().optional(),
  definition: jzodReference,
});
export type JzodSchemaDefinition = z.infer<typeof jzodSchemaDefinitionSchema>;