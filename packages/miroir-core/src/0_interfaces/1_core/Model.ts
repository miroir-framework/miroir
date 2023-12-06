import { z } from "zod";

import { EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";

import { EntityDefinitionSchema, MetaEntitySchema } from "../../0_interfaces/1_core/EntityDefinition.js";
import { jzodSchemaDefinitionSchema } from "../../0_interfaces/1_core/JzodSchemaDefinition.js";
import { StoreBasedConfigurationSchema } from "../../0_interfaces/1_core/MiroirConfig.js";
import { MiroirApplicationVersionSchema } from "../../0_interfaces/1_core/ModelVersion.js";
// import { ReportSchema } from "../../0_interfaces/1_core/Report.js";
import { report } from "./preprocessor-generated/server-generated";

import { EntityInstance, entityInstance } from "./preprocessor-generated/miroirFundamentalType";

export interface MiroirModelDefinition extends EntityInstanceWithName {

}

/**
 * internal data structure used to manipulate model data
 */
export interface MiroirModel {
  [parentUuid: string]: {[uuid:string]:EntityInstance}
}

export const ApplicationVersionCrossEntityDefinitionSchema = entityInstance.extend({
  applicationVersion: z.string().uuid(),
  entityDefinition: z.string().uuid(),
});

export const ApplicationModelSchema = z.object({
  applicationVersions: z.array(MiroirApplicationVersionSchema),
  applicationVersionCrossEntityDefinition: z.array(ApplicationVersionCrossEntityDefinitionSchema),
  configuration: z.array(StoreBasedConfigurationSchema),
  entities: z.array(MetaEntitySchema),
  entityDefinitions: z.array(EntityDefinitionSchema),
  jzodSchemas:z.array(jzodSchemaDefinitionSchema),
  // reports: z.array(ReportSchema),
  reports: z.array(report),
});

export type MiroirApplicationModel = z.infer<typeof ApplicationModelSchema>



