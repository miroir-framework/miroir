import { z } from "zod";

import {
  ApplicationDeploymentSchema,
  domainElementObject,
  entity,
  entityDefinition,
  entityInstance,
  entityInstancesUuidIndex,
  jzodElement,
  jzodSchema,
  metaModel
} from "miroir-core";

export const TableComponentTypeSchema = z.enum(["EntityInstance", "JSON_ARRAY"]);

export type TableComponentType = z.infer<typeof TableComponentTypeSchema>;

// export const TableComponentCellSchema = z.object({
//   link: z.string().optional(),
//   value: z.any(),
// });
// export type TableComponentCell = z.infer<typeof TableComponentCellSchema>;

// export const TableComponentRowSchema = z.record(TableComponentCellSchema);
// export type TableComponentRow = z.infer<typeof TableComponentRowSchema>;

export const tableComponentCorePropsSchema = z.object({
  columnDefs: z.object({ columnDefs: z.array(z.any()) }),
  instancesToDisplay: entityInstancesUuidIndex.optional(), // TODO: lower it down to TableCompnentEntityInstancePropsSchema, this should not appear in TableComponentJsonArrayPropsSchema
  styles: z.any().optional(),
  children: z.any(),
  displayTools: z.boolean(),
  currentModel: metaModel,
  defaultFormValuesObject: z.any(),
  miroirFundamentalJzodSchema:jzodSchema,
  sortByAttribute: z.string().optional(),
  deploymentUuid: z.string().uuid(),
  paramsAsdomainElements: domainElementObject,
  // setCurrentObjectValue: z.function().args(z.any()),
});

export const tableComponentEntityInstancePropsSchema = tableComponentCorePropsSchema.extend({
  type: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  displayedDeploymentDefinition: ApplicationDeploymentSchema,
  currentEntity: entity.optional(),
  // currentEntityDefinition: entityDefinition.optional(),
  currentEntityDefinition: entityDefinition,
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

export const tableComponentRowSchema = z.object({
  displayedValue: z.any(),
  rawValue: entityInstance,
  jzodSchema: z.record(jzodElement),
})

export const tableComponentRowArraySchema = z.array(
  tableComponentRowSchema
)

// export const tableComponentRows = 
export type TableComponentRow = z.infer<typeof tableComponentRowSchema>;
export type TableComponentRowArraySchema = z.infer<typeof tableComponentRowArraySchema>;