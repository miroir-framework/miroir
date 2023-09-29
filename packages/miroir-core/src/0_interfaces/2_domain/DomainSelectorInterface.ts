import { JzodReference } from "@miroir-framework/jzod-ts";
import { Uuid } from "../1_core/EntityDefinition";
import { ApplicationSection, EntityInstance } from "../1_core/Instance";
import { SelectObjectInstanceQuery, SelectObjectListQuery } from "../1_core/preprocessor-generated/server-generated";
import { EntityInstancesUuidIndex } from "./DomainControllerInterface";


export type FetchedData = { [k: string]: EntityInstance | EntityInstancesUuidIndex | undefined };

export interface DomainEntityInstancesSelectorParams {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  instanceUuid?: Uuid,
}


export type EntityInstanceListQueryParams = {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  query: SelectObjectListQuery;
};

export type EntityInstanceQueryParams = {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  query: SelectObjectInstanceQuery;
};

export type MiroirSelectorSingleQueryParams =
  | { type: "DomainEntityInstancesSelectorParams"; definition: DomainEntityInstancesSelectorParams }
  | { type: "EntityInstanceQueryParams"; definition: EntityInstanceQueryParams }
  | { type: "EntityInstanceListQueryParams"; definition: EntityInstanceListQueryParams }
;

export type MiroirSelectorManyQueryParams = { type: "ManyQueryParams"; definition: {[k: string]: MiroirSelectorSingleQueryParams} };

export type MiroirSelectorQueryParams = MiroirSelectorSingleQueryParams | MiroirSelectorManyQueryParams;
