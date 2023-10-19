import { JzodElement } from "@miroir-framework/jzod-ts";
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

export type RecordOfJzodElement = Record<string, JzodElement | undefined>;

export type FetchedData = { [k: string]: EntityInstance | EntityInstancesUuidIndex | undefined };

export interface LocalCacheEntityInstancesSelectorParams {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  instanceUuid?: Uuid,
}


export type DomainSingleSelectQuery = {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  select: MiroirSelectQuery;
}

export type LocalCacheQueryParams =
  | { type: "LocalCacheEntityInstancesSelectorParams"; definition: LocalCacheEntityInstancesSelectorParams }
;

export interface DomainModelRootQuery {
  pageParams?: Record<string, any>,
  fetchedData?: FetchedData,
}

export interface DomainFetchQueryParams extends DomainModelRootQuery {
  type: "DomainManyQueries";
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  // select: { [k: string]: LocalCacheQueryParams };
  select: MiroirSelectQueriesRecord;
  combine?: MiroirCombineQuery
};

export interface DomainModelGetEntityDefinitionQueryParams extends DomainModelRootQuery {
  type: "getEntityDefinition",
  deploymentUuid: Uuid,
  entityUuid: Uuid,
};

export interface DomainModelGetFetchParamJzodSchemaQueryParams extends DomainModelRootQuery  {
  type: "getFetchParamsJzodSchema",
  fetchParams: DomainFetchQueryParams,
};

export interface DomainModelGetSingleSelectQueryJzodSchemaQueryParams extends DomainModelRootQuery {
  type: "getSingleSelectQueryJzodSchema",
  singleSelectQuery: DomainSingleSelectQuery,
  // singleSelectQuery: MiroirSelectQuery,
};

export type DomainModelQueryParams =
  | DomainModelGetEntityDefinitionQueryParams
  | DomainModelGetFetchParamJzodSchemaQueryParams
  | DomainModelGetSingleSelectQueryJzodSchemaQueryParams;
;


export type MiroirSelectorQueryParams = LocalCacheQueryParams | DomainFetchQueryParams | DomainModelQueryParams;
