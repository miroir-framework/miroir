import { z } from "zod";

import { EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";


import { Entity, EntityDefinition, EntityInstance, Report, entityInstance, type ApplicationSection, type Query } from "./preprocessor-generated/miroirFundamentalType";

export interface MiroirModelDefinition extends EntityInstanceWithName {

}

/**
 * internal data structure used to manipulate model data
 */
export interface MiroirModel {
  [parentUuid: string]: {[uuid:string]:EntityInstance}
}

// #217 Phase 12
export const ApplicationVersionCrossEntityVersionSchema = entityInstance.extend({
  applicationVersion: z.string().uuid(),
  entityVersion: z.string().uuid(),
});
/** @deprecated Use ApplicationVersionCrossEntityVersionSchema */
export const ApplicationVersionCrossEntityDefinitionSchema =
  ApplicationVersionCrossEntityVersionSchema;

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

export const defaultApplicationSection = "data" as ApplicationSection;
