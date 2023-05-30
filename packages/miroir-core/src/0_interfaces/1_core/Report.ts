import { z } from "zod";
import { EntityInstanceWithNameSchema } from "./Instance.js";

// ##########################################################################################
export const ReportListDefinitionSchema = z.object({
  parentName: z.string().optional(),
  parentUuid: z.string().uuid(),
});
export type ReportListDefinition = z.infer<typeof ReportListDefinitionSchema>;

export const ReportDefinitionSchema = ReportListDefinitionSchema;
export type ReportDefinition = z.infer<typeof ReportDefinitionSchema>;

// ##########################################################################################
export const ReportTypeSchema = z.union([
  z.literal("list"),
  z.literal("grid"),
]);
export type ReportType = z.infer<typeof ReportTypeSchema>;

// #################################################################################################
export const ReportSchema = EntityInstanceWithNameSchema.extend({
  defaultLabel: z.string(),
  type: ReportTypeSchema,
  definition: ReportListDefinitionSchema,
});
export type Report = z.infer<typeof ReportSchema>;

export default {}