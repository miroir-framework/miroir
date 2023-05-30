import { z } from "zod";

import { EntityInstance, EntityInstanceSchema, EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";
import { MiroirApplicationVersion } from "../../0_interfaces/1_core/ModelVersion";

import { EntityDefinition, MetaEntity } from "./EntityDefinition";
import { StoreBasedConfiguration } from "./MiroirConfig";
import { Report } from "./Report";

export interface MiroirModelDefinition extends EntityInstanceWithName {

}

/**
 * internal data structure used to manipulate model data
 */
export interface MiroirModel {
  [parentUuid: string]: {[uuid:string]:EntityInstance}
}

export const ZapplicationVersionCrossEntityDefinition = EntityInstanceSchema.extend({
  applicationVersion: z.string().uuid(),
  entityDefinition: z.string().uuid(),
});


export interface MiroirMetaModel {// TODO: the name of meta-model entities cannot change in the current implementation
  entities: MetaEntity[];
  entityDefinitions: EntityDefinition[];
  reports: Report[];
  applicationVersions: MiroirApplicationVersion[];
  applicationVersionCrossEntityDefinition: z.infer<typeof ZapplicationVersionCrossEntityDefinition>[];
  configuration: StoreBasedConfiguration[];
}


