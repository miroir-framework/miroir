// import { z } from "zod";
// import { EntityInstanceWithNameSchema } from "../../0_interfaces/1_core/Instance.js";

// // ################################################################################################
// export const ReportSectionListDefinitionSchema = z.object({
//   parentName: z.string().optional(),
//   parentUuid: z.string().uuid(),
// });
// export type ReportSectionListDefinition = z.infer<typeof ReportSectionListDefinitionSchema>;

// // ################################################################################################
// export const ReportSectionListSchema = z.object({
//   type: z.literal("objectList"),
//   definition: ReportSectionListDefinitionSchema,
// })
// export type ReportSectionList = z.infer<typeof ReportSectionListSchema>;

// export const ReportSectionObjectDetailsSchema = z.object({
//   type: z.literal("objectDetails"),
//   definition: z.any(),
// })
// export type ReportSectionObjectDetails = z.infer<typeof ReportSectionObjectDetailsSchema>;

// // ################################################################################################
// export const ReportSectionSchema = z.union([
//   ReportSectionListSchema,
//   ReportSectionObjectDetailsSchema,
// ]);
// export type ReportSection = z.infer<typeof ReportSectionSchema>;

// // ################################################################################################
// export const ReportListTypeSchema = EntityInstanceWithNameSchema.extend({
//   defaultLabel: z.string(),
//   type: z.literal("list"),
//   definition: z.array(ReportSectionSchema),
// });
// export type ReportListType = z.infer<typeof ReportListTypeSchema>;

// // ################################################################################################
// export const ReportGridTypeSchema = EntityInstanceWithNameSchema.extend({
//   defaultLabel: z.string(),
//   type: z.literal("grid"),
//   definition: z.array(z.array(ReportSectionSchema)),
// });
// export type ReportGridType = z.infer<typeof ReportGridTypeSchema>;

// // #################################################################################################
// export const ReportSchema = z.union([
//   ReportGridTypeSchema,
//   ReportListTypeSchema,
// ]);

// export type Report = z.infer<typeof ReportSchema>;

// export default {}