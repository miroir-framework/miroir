import { z } from "zod";

import { EntityInstance, EntityInstanceSchema, EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";

import { EntityDefinitionSchema, MetaEntitySchema } from "../../0_interfaces/1_core/EntityDefinition.js";
import { jzodSchemaDefinitionSchema } from "../../0_interfaces/1_core/JzodSchemaDefinition.js";
import { StoreBasedConfigurationSchema } from "../../0_interfaces/1_core/MiroirConfig.js";
import { MiroirApplicationVersionSchema } from "../../0_interfaces/1_core/ModelVersion.js";
import { ReportSchema } from "../../0_interfaces/1_core/Report.js";

export interface MiroirModelDefinition extends EntityInstanceWithName {

}

/**
 * internal data structure used to manipulate model data
 */
export interface MiroirModel {
  [parentUuid: string]: {[uuid:string]:EntityInstance}
}

export const ApplicationVersionCrossEntityDefinitionSchema = EntityInstanceSchema.extend({
  applicationVersion: z.string().uuid(),
  entityDefinition: z.string().uuid(),
});

export const MiroirMetaModelSchema = z.object({
  applicationVersions: z.array(MiroirApplicationVersionSchema),
  applicationVersionCrossEntityDefinition: z.array(ApplicationVersionCrossEntityDefinitionSchema),
  configuration: z.array(StoreBasedConfigurationSchema),
  entities: z.array(MetaEntitySchema),
  entityDefinitions: z.array(EntityDefinitionSchema),
  jzodSchemas:z.array(jzodSchemaDefinitionSchema),
  reports: z.array(ReportSchema),
});

export type MiroirMetaModel = z.infer<typeof MiroirMetaModelSchema>



