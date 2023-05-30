import { z } from "zod";
import { EntityInstanceWithName, EntityInstanceWithNameSchema } from "./Instance.js";

// ##########################################################################################
export const ReportListDefinitionSchema = z.object({
  parentName: z.string().optional(),
  parentUuid: z.string().uuid(),
});
export type ReportListDefinition = z.infer<typeof ReportListDefinitionSchema>;
// export interface MiroirReportListDefinition {
//   "parentName"?: string,
//   "parentUuid": string,
// };

export const ReportDefinitionSchema = ReportListDefinitionSchema;
export type ReportDefinition = z.infer<typeof ReportDefinitionSchema>;
// export type ReportDefinition = ReportListDefinition;

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

// export interface Report extends EntityInstanceWithName {
//   "defaultLabel": string,
//   "type": 'list' | 'grid',
//   "definition": ReportDefinition,
// };


export default {}