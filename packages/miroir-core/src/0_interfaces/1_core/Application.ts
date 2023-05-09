import { z } from "zod";
import { ZinstanceWithName } from "./StorageConfiguration.js";

export const ApplicationSchema = ZinstanceWithName.extend({
  defaultLabel: z.string(),
  description: z.string(),
})


export type Application = z.infer<typeof ApplicationSchema>;
