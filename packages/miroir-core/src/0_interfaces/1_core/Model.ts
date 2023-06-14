import { z } from "zod";

import { EntityInstance, EntityInstanceSchema, EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";

import { EntityDefinitionSchema, MetaEntitySchema } from "./EntityDefinition";
import { StoreBasedConfigurationSchema } from "./MiroirConfig";
import { ReportSchema } from "./Report";

export interface MiroirModelDefinition extends EntityInstanceWithName {

}

/**
 * internal data structure used to manipulate model data
 */
export interface MiroirModel {
  [parentUuid: string]: {[uuid:string]:EntityInstance}
}

export const ZapplicationVersionCrossEntityDefinitionSchema = EntityInstanceSchema.extend({
  applicationVersion: z.string().uuid(),
  entityDefinition: z.string().uuid(),
});

export const MiroirMetaModelSchema = z.object({
  entities: z.array(MetaEntitySchema),
  entityDefinitions: z.array(EntityDefinitionSchema),
  reports: z.array(ReportSchema),
  // applicationVersions: MiroirApplicationVersion[];
  applicationVersions: z.array(z.any()),
  applicationVersionCrossEntityDefinition: z.array(ZapplicationVersionCrossEntityDefinitionSchema),
  configuration: z.array(StoreBasedConfigurationSchema),
});

export type MiroirMetaModel = z.infer<typeof MiroirMetaModelSchema>


// export interface MiroirMetaModel {// TODO: the name of meta-model entities cannot change in the current implementation
//   entities: MetaEntity[];
//   entityDefinitions: EntityDefinition[];
//   reports: Report[];
//   applicationVersions: MiroirApplicationVersion[];
//   applicationVersionCrossEntityDefinition: z.infer<typeof ZapplicationVersionCrossEntityDefinitionSchema>[];
//   configuration: StoreBasedConfiguration[];
// }


