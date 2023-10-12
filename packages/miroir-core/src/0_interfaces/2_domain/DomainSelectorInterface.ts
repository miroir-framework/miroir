import { Uuid } from "../1_core/EntityDefinition";
import { ApplicationSection, EntityInstance } from "../1_core/Instance";
import { MiroirCombineQuery, MiroirSelectQueriesRecord, MiroirSelectQuery, SelectObjectInstanceQuery, SelectObjectListQuery } from "../1_core/preprocessor-generated/server-generated";
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

export type MiroirSelectorFetchDataQueryParams = {
  type: "ManyQueryParams";
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  // select: { [k: string]: MiroirSelectorSingleQueryParams };
  select: MiroirSelectQueriesRecord;
  combine?: MiroirCombineQuery
};

export type DirectedSelectQuery = {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  select: MiroirSelectQuery;
}

export type MiroirSelectorSingleQueryParams =
  | { type: "DomainEntityInstancesSelectorParams"; definition: DomainEntityInstancesSelectorParams }
  // | { type: "ObjectQueryParams"; definition: ObjectQueryParams }
  | { type: "ObjectQueryParams"; definition: MiroirSelectorFetchDataQueryParams }
;


export type MiroirSelectorQueryParams = MiroirSelectorSingleQueryParams | MiroirSelectorFetchDataQueryParams;
