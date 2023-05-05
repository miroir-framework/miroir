import { z } from "zod";

import { EntityInstance, EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";
import { MiroirApplicationVersion } from "../../0_interfaces/1_core/ModelVersion";
import { ZinstanceSchema } from "../../0_interfaces/1_core/StorageConfiguration";

import { EntityDefinition, MetaEntity } from "./EntityDefinition";
import { StoreBasedConfiguration } from "./MiroirConfig";
import { MiroirReport } from "./Report";

export interface MiroirModelDefinition extends EntityInstanceWithName {

}

/**
 * internal data structure used to manipulate model data
 */
export interface MiroirModel {
  [parentUuid: string]: {[uuid:string]:EntityInstance}
}

export const ZapplicationVersionCrossEntityDefinition = ZinstanceSchema.extend({
  applicationVersion: z.string().uuid(),
  entityDefinition: z.string().uuid(),
});


export interface MiroirMetaModel {// TODO: the name of meta-model entities cannot change in the current implementation
  entities: MetaEntity[];
  entityDefinitions: EntityDefinition[];
  reports: MiroirReport[];
  applicationVersions: MiroirApplicationVersion[];
  applicationVersionCrossEntityDefinition: z.infer<typeof ZapplicationVersionCrossEntityDefinition>[];
  configuration: StoreBasedConfiguration[];
}


