import { z } from "zod";

import { EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";


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

// export const ApplicationModelSchema = z.object({
//   applicationVersions: z.array(MiroirApplicationVersionSchemaOLD_DO_NOT_USE),
//   applicationVersionCrossEntityDefinition: z.array(ApplicationVersionCrossEntityDefinitionSchema),
//   configuration: z.array(StoreBasedConfigurationSchema),
//   entities: z.array(MetaEntitySchema),
//   entityDefinitions: z.array(entityDefinition),
//   jzodSchemas:z.array(jzodSchemaDefinitionSchema),
//   reports: z.array(report),
// });

// export type MiroirApplicationModel = z.infer<typeof ApplicationModelSchema>



