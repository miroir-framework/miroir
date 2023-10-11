import { Uuid } from "../1_core/EntityDefinition";
import { ApplicationSection, EntityInstance } from "../1_core/Instance";
import { MiroirCombineQuery, SelectObjectInstanceQuery, SelectObjectListQuery } from "../1_core/preprocessor-generated/server-generated";
import { EntityInstancesUuidIndex } from "./DomainControllerInterface";


export type FetchedData = { [k: string]: EntityInstance | EntityInstancesUuidIndex | undefined };

export interface DomainEntityInstancesSelectorParams {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  instanceUuid?: Uuid,
}


export type ObjectQueryParams = {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  query: {
    select: SelectObjectListQuery | SelectObjectInstanceQuery,
    combine?: MiroirCombineQuery
  };
};

export type MiroirSelectorSingleQueryParams =
  | { type: "DomainEntityInstancesSelectorParams"; definition: DomainEntityInstancesSelectorParams }
  | { type: "ObjectQueryParams"; definition: ObjectQueryParams }
;

export type MiroirSelectorFetchDataQueryParams = { type: "ManyQueryParams"; definition: {[k: string]: MiroirSelectorSingleQueryParams} };

export type MiroirSelectorQueryParams = MiroirSelectorSingleQueryParams | MiroirSelectorFetchDataQueryParams;
