import { z } from "zod";

import {
  ApplicationDeploymentSchema,
  MetaEntitySchema,
  applicationSection,
  entityDefinition,
  selectObjectListQuery
} from "miroir-core";

import { jzodObject } from "@miroir-framework/jzod-ts";
import { TableComponentTypeSchema } from "./4_view/MTableComponentInterface";

// ################################################################################################
export const ReportSectionDisplayCorePropsSchema = z.object({
  styles: z.any().optional(),
  label: z.string(),
  defaultlabel: z.string().optional(),
  displayedDeploymentDefinition: ApplicationDeploymentSchema.optional(),
  select: selectObjectListQuery.optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  fetchedData: z.record(z.any()).optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  fetchedDataJzodSchema: z.record(jzodObject.optional()).optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
  chosenApplicationSection: applicationSection.optional(), // ugly, this is due to the need of calling hooks in the same order, irrelevant of tableComponentReportType. Should be in ReportSectionDisplayEntityInstancePropsSchema.
});

export const ReportSectionDisplayEntityInstancePropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  chosenApplicationSection: applicationSection,
  currentModel: z.any(),
  currentMiroirEntity: MetaEntitySchema.optional(),
  currentMiroirEntityDefinition: entityDefinition.optional(),
});

export const ReportSectionDisplayJsonArrayPropsSchema = ReportSectionDisplayCorePropsSchema.extend({
  tableComponentReportType: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
  columnDefs: z.array(z.any()),
  rowData: z.array(z.any()),
});
