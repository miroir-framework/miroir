import { z } from "zod";

import { EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";


import { Entity, EntityDefinition, EntityInstance, Report, entityInstance, type Query } from "./preprocessor-generated/miroirFundamentalType";

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

export type DeploymentUuidToReportsEntitiesDefinitions = {
  model: {
    availableQueries: Query[];
    availableReports: Report[];
    entities: Entity[];
    entityDefinitions: EntityDefinition[];
  };
  data: {
    availableQueries: Query[];
    availableReports: Report[];
    entities: Entity[];
    entityDefinitions: EntityDefinition[];
  };
};
export type DeploymentUuidToReportsEntitiesDefinitionsMapping = {
  [x: string]: DeploymentUuidToReportsEntitiesDefinitions
};

export const foldableElementTypes = [ "array", "tuple", "object", "record" ]; // no union or reference since we use the resolved type!
