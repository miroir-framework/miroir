import { Uuid } from "../1_core/EntityDefinition";
import { ApplicationSection, EntityInstance } from "../1_core/Instance";
import {
  MiroirCombineQuery,
  MiroirSelectQueriesRecord,
  MiroirSelectQuery,
  SelectObjectInstanceQuery,
  SelectObjectListQuery,
} from "../1_core/preprocessor-generated/server-generated";
import { EntityInstancesUuidIndex } from "./DomainControllerInterface";


export type FetchedData = { [k: string]: EntityInstance | EntityInstancesUuidIndex | undefined };

export interface LocalCacheEntityInstancesSelectorParams {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  instanceUuid?: Uuid,
}


export type DomainFetchQueryParams = {
  type: "DomainManyQueries";
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  // select: { [k: string]: LocalCacheQueryParams };
  select: MiroirSelectQueriesRecord;
  combine?: MiroirCombineQuery
};

export type DomainSingleSelectQuery = {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  select: MiroirSelectQuery;
}

export type LocalCacheQueryParams =
  | { type: "LocalCacheEntityInstancesSelectorParams"; definition: LocalCacheEntityInstancesSelectorParams }
;

export type DomainModelQueryParams = {
  type: "DomainModelSelectorParams";
  definition: {
    type: "getEntityDefinition",
    deploymentUuid?: Uuid,
    entityUuid: Uuid,
  };
};


export type MiroirSelectorQueryParams = LocalCacheQueryParams | DomainFetchQueryParams | DomainModelQueryParams;
