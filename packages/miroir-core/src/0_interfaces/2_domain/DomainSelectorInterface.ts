import { JzodReference } from "@miroir-framework/jzod-ts";
import { Uuid } from "../1_core/EntityDefinition";
import { ApplicationSection } from "../1_core/Instance";
import { SelectObjectInstanceQuery, SelectObjectListQuery } from "../1_core/preprocessor-generated/server-generated";

export interface DomainEntityInstancesSelectorParams {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  instanceUuid?: Uuid,
}


export type EntityInstanceListQueryParams = {localCacheSelectorParams: DomainEntityInstancesSelectorParams, query: SelectObjectListQuery};
export type EntityInstanceQueryParams = {localCacheSelectorParams: DomainEntityInstancesSelectorParams, query: SelectObjectInstanceQuery};

export type MiroirSelectorParams =
  | { type: "DomainEntityInstancesSelectorParams"; definition: DomainEntityInstancesSelectorParams }
  | { type: "EntityInstanceQueryParams"; definition: EntityInstanceQueryParams }
  | { type: "EntityInstanceListQueryParams"; definition: EntityInstanceListQueryParams }
;
