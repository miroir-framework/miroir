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
