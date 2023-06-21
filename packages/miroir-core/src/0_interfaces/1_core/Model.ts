import { z } from "zod";

import { EntityInstance, EntityInstanceSchema, EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";

import { EntityDefinitionSchema, MetaEntitySchema } from "./EntityDefinition";
import { StoreBasedConfigurationSchema } from "./MiroirConfig";
import { ReportSchema } from "./Report";
import { MiroirApplicationVersionSchema } from "./ModelVersion";

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
  entities: z.array(MetaEntitySchema),
  entityDefinitions: z.array(EntityDefinitionSchema),
  // entityDefinitions: z.array(z.any()),
  reports: z.array(ReportSchema),
  applicationVersions: z.array(MiroirApplicationVersionSchema),
  applicationVersionCrossEntityDefinition: z.array(ApplicationVersionCrossEntityDefinitionSchema),
  configuration: z.array(StoreBasedConfigurationSchema),
});

export type MiroirMetaModel = z.infer<typeof MiroirMetaModelSchema>



