import { z } from "zod";

import { EntityInstanceWithName } from "../../0_interfaces/1_core/Instance";


import { Entity, EntityVersion, EntityInstance, Report, entityInstance, type ApplicationSection, type Query } from "./preprocessor-generated/miroirFundamentalType";

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

export type DeploymentUuidToReportsEntities = {
  model: {
    availableQueries: Query[];
    availableReports: Report[];
    entities: Entity[];
    entityVersions: EntityVersion[];
  };
  data: {
    availableQueries: Query[];
    availableReports: Report[];
    entities: Entity[];
    entityVersions: EntityVersion[];
  };
};
export type DeploymentUuidToReportsEntitiesMapping = {
  [x: string]: DeploymentUuidToReportsEntities
};

export const foldableElementTypes = [ "array", "tuple", "object", "record" ]; // no union or reference since we use the resolved type!

export const defaultApplicationSection = "data" as ApplicationSection;
