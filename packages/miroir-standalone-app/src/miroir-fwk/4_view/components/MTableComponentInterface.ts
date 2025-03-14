import { z } from "zod";

import {
  // SelfApplicationDeploymentConfigurationSchema,
  domainElementObject,
  entity,
  entityDefinition,
  entityInstance,
  entityInstancesUuidIndex,
  jzodElement,
  jzodSchema,
  metaModel,
  selfApplicationDeploymentConfiguration
} from "miroir-core";

export const TableComponentTypeSchema = z.enum(["EntityInstance", "JSON_ARRAY"]);

export type TableComponentType = z.infer<typeof TableComponentTypeSchema>;

export const tableComponentCorePropsSchema = z.object({
  columnDefs: z.object({ columnDefs: z.array(z.any()) }),
  instancesToDisplay: entityInstancesUuidIndex.optional(), // TODO: lower it down to TableCompnentEntityInstancePropsSchema, this should not appear in TableComponentJsonArrayPropsSchema
  styles: z.any().optional(),
  children: z.any(),
  displayTools: z.boolean(),
  currentModel: metaModel,
  defaultFormValuesObject: z.any(),
  sortByAttribute: z.string().optional(),
  deploymentUuid: z.string().uuid(),
  paramsAsdomainElements: domainElementObject,
  foreignKeyObjects: z.record(z.string(),entityInstancesUuidIndex),
});

export const tableComponentEntityInstancePropsSchema = tableComponentCorePropsSchema.extend({
  type: z.literal(TableComponentTypeSchema.enum.EntityInstance),
  // displayedDeploymentDefinition: SelfApplicationDeploymentConfigurationSchema,
  displayedDeploymentDefinition: selfApplicationDeploymentConfiguration,
  currentEntity: entity.optional(),
  currentEntityDefinition: entityDefinition,
  onRowEdit: z.function().args(z.any()).returns(z.void()).optional(),
  onRowDelete: z.function().args(z.any()).returns(z.void()).optional(),
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
  deploymentUuid: z.string().uuid(),
  rawValue: entityInstance,
  jzodSchema: z.record(jzodElement),
  foreignKeyObjects: z.record(entityInstancesUuidIndex)
})

export const tableComponentRowArraySchema = z.array(
  tableComponentRowSchema
)

// export const tableComponentRows = 
export type TableComponentRow = z.infer<typeof tableComponentRowSchema>;
export type TableComponentRowArraySchema = z.infer<typeof tableComponentRowArraySchema>;