import { z } from "zod";

import { EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";


import { Entity, EntityDefinition, EntityInstance, Report, entityInstance } from "./preprocessor-generated/miroirFundamentalType";

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

export type DeploymentUuidToReportsEntitiesDefinitionsMapping = {
  [x: string]: {
      model: {
          availableReports: Report[];
          entities: Entity[];
          entityDefinitions: EntityDefinition[];
      };
      data: {
          availableReports: Report[];
          entities: Entity[];
          entityDefinitions: EntityDefinition[];
      };
  }
};

export const foldableElementTypes = [ "array", "tuple", "object", "record" ]; // no union or reference since we use the resolved type!
