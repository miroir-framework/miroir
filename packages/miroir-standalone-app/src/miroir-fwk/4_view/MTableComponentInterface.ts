import { z } from "zod";

import {
  entityInstancesUuidIndexSchema,
  ApplicationDeploymentSchema,
  MetaEntitySchema,
  EntityDefinitionSchema,
  objectListReportSection,
} from "miroir-core";

export const TableComponentTypeSchema = z.enum(["EntityInstance", "JSON_ARRAY"]);

export type TableComponentType = z.infer<typeof TableComponentTypeSchema>;

export const TableComponentCellSchema = z.object({
  link: z.string().optional(),
  value: z.any(),
});
export type TableComponentCell = z.infer<typeof TableComponentCellSchema>;

export const TableComponentRowSchema = z.record(TableComponentCellSchema);
export type TableComponentRow = z.infer<typeof TableComponentRowSchema>;

export const tableComponentCorePropsSchema = z.object({
  columnDefs: z.object({ columnDefs: z.array(z.any()) }),
  instancesToDisplay: entityInstancesUuidIndexSchema.optional(), // TODO: lower it down to TableCompnentEntityInstancePropsSchema, this should not appear in TableComponentJsonArrayPropsSchema
  styles: z.any().optional(),
  children: z.any(),
  displayTools: z.boolean(),
});

export const tableComponentEntityInstancePropsSchema = tableComponentCorePropsSchema.extend({
  type: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  displayedDeploymentDefinition: ApplicationDeploymentSchema,
  currentEntity: MetaEntitySchema.optional(),
  currentEntityDefinition: EntityDefinitionSchema.optional(),
  reportSectionListDefinition: objectListReportSection,
  onRowEdit: z.function().args(z.any()).returns(z.void()).optional(),
});
export type TableComponentEntityInstanceProps = z.infer<typeof tableComponentEntityInstancePropsSchema>;

export const TableComponentJsonArrayPropsSchema = tableComponentCorePropsSchema.extend({
  type: z.literal(TableComponentTypeSchema.enum.JSON_ARRAY),
  rowData: z.array(z.any()),
});
export type TableComponentJsonArrayProps = z.infer<typeof TableComponentJsonArrayPropsSchema>;

// ##########################################################################################
export const TableComponentPropsSchema = z.union([
  tableComponentEntityInstancePropsSchema,
  TableComponentJsonArrayPropsSchema,
]);

export type TableComponentProps = z.infer<typeof TableComponentPropsSchema>;
