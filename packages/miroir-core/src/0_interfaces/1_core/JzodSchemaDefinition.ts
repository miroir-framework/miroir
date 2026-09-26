import { z } from "zod";

import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance";
import { mlReference } from "./preprocessor-generated/miroirFundamentalType";

// TODO: DEFUNCT???
export const jzodSchemaDefinitionSchema = EntityInstanceWithNameSchema.extend({
  description: z.string().optional(),
  defaultLabel: z.string().optional(),
  definition: mlReference,
});
export type JzodSchemaDefinition = z.infer<typeof jzodSchemaDefinitionSchema>;