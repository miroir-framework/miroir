import { z } from "zod";
import { EntityInstanceWithNameSchema } from "./Instance.js";

export const ApplicationSchema = EntityInstanceWithNameSchema.extend({
  defaultLabel: z.string(),
  description: z.string(),
})


export type Application = z.infer<typeof ApplicationSchema>;
