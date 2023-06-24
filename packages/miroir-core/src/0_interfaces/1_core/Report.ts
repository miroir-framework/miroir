import { z } from "zod";
import { EntityInstanceWithNameSchema } from "./Instance.js";

// ##########################################################################################
export const ReportSectionListDefinitionSchema = z.object({
  parentName: z.string().optional(),
  parentUuid: z.string().uuid(),
});
export type ReportSectionListDefinition = z.infer<typeof ReportSectionListDefinitionSchema>;

export const ReportSectionListSchema = z.object({
  type: z.literal("objectList"),
  definition: ReportSectionListDefinitionSchema,
})
export type ReportSectionList = z.infer<typeof ReportSectionListSchema>;

export const ReportSectionObjectDetailsSchema = z.object({
  type: z.literal("objectDetails"),
  // definition: ReportListDefinitionSchema,
})
export type ReportSectionObjectDetails = z.infer<typeof ReportSectionObjectDetailsSchema>;

export const ReportSectionSchema = z.union([
  ReportSectionListSchema,
  ReportSectionObjectDetailsSchema,
]);
export type ReportSection = z.infer<typeof ReportSectionSchema>;

// export const ReportDefinitionSchema = z.object({
//   sections: z.array(ReportSectionSchema)
// });;
// export type ReportDefinition = z.infer<typeof ReportDefinitionSchema>;

// ##########################################################################################
export const ReportListTypeSchema = EntityInstanceWithNameSchema.extend({
  defaultLabel: z.string(),
  type: z.literal("list"),
  definition: z.array(ReportSectionSchema),
});
// z.union([
//   z.literal("list"),
//   z.literal("grid"),
// ]);
export type ReportListType = z.infer<typeof ReportListTypeSchema>;

// ##########################################################################################
export const ReportGridTypeSchema = EntityInstanceWithNameSchema.extend({
  defaultLabel: z.string(),
  type: z.literal("grid"),
  definition: z.array(z.array(ReportSectionSchema)),
});
// z.union([
//   z.literal("list"),
//   z.literal("grid"),
// ]);
export type ReportGridType = z.infer<typeof ReportGridTypeSchema>;

// #################################################################################################
export const ReportSchema = z.union([
  ReportGridTypeSchema,
  ReportListTypeSchema,
])
// EntityInstanceWithNameSchema.extend({
//   defaultLabel: z.string(),
//   type: ReportTypeSchema,
//   definition: ReportDefinitionSchema,
// })
;
export type Report = z.infer<typeof ReportSchema>;

export default {}