import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import { Uuid } from "../1_core/EntityDefinition";
import {
  ApplicationSection,
  ResultsFromQuery,
  MiroirCrossJoinQuery,
  MiroirCustomQueryParams,
  MiroirFetchQuery,
  MiroirSelectQueriesRecord,
  MiroirSelectQuery,
  QueryFailed,
  SelectObjectListQuery,
  SelectObjectQuery,
  ResultsFromQueryObject,
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "./DomainControllerInterface";

export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;


// ################################################################################################
export type DomainStateSelector<P extends MiroirSelectorQueryParams> = (
  domainState: DomainState,
  params: P
  // params: MiroirSelectorQueryParams
) => ResultsFromQuery;

// ################################################################################################
export interface LocalCacheEntityInstancesSelectorParams {
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  entityUuid?: Uuid,
  instanceUuid?: Uuid,
}

export type LocalCacheQueryParams = {
  queryType: "LocalCacheEntityInstancesSelectorParams";
  definition: LocalCacheEntityInstancesSelectorParams;
};

// ################################################################################################

export type DomainSingleSelectObjectQueryWithDeployment = {
  queryType: "domainSingleSelectQueryWithDeployment"
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  select: SelectObjectQuery;
}

export type DomainSingleSelectObjectListQueryWithDeployment = {
  queryType: "domainSingleSelectQueryWithDeployment"
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  select: SelectObjectListQuery;
}

export type DomainSingleSelectQueryWithDeployment = {
  queryType: "domainSingleSelectQueryWithDeployment"
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  select: MiroirSelectQuery;
};

// ################################################################################################
export interface DomainModelRootQuery {
  pageParams?: Record<string, any>,
  contextResults: ResultsFromQueryObject,
}

export interface DomainModelGetSingleSelectObjectQueryQueryParams extends DomainModelRootQuery {
  queryType: "getSingleSelectQuery",
  singleSelectQuery: DomainSingleSelectObjectQueryWithDeployment,
};

export interface DomainModelGetSingleSelectObjectListQueryQueryParams extends DomainModelRootQuery {
  queryType: "getSingleSelectQuery",
  singleSelectQuery: DomainSingleSelectObjectListQueryWithDeployment,
};

export interface DomainModelGetSingleSelectQueryQueryParams extends DomainModelRootQuery {
  queryType: "getSingleSelectQuery",
  singleSelectQuery: DomainSingleSelectQueryWithDeployment,
};


// ################################################################################################
export interface DomainManyQueriesWithDeploymentUuid extends DomainModelRootQuery {
  queryType: "DomainManyQueries",
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  fetchQuery?: MiroirFetchQuery,
  select?: MiroirSelectQueriesRecord,
  crossJoin?: MiroirCrossJoinQuery,
};

// ################################################################################################
// JZOD SCHEMAs
// ################################################################################################
export interface DomainModelGetEntityDefinitionQueryParams extends DomainModelRootQuery {
  queryType: "getEntityDefinition",
  deploymentUuid: Uuid,
  entityUuid: Uuid,
};

export interface DomainModelGetFetchParamJzodSchemaQueryParams extends DomainModelRootQuery  {
  queryType: "getFetchParamsJzodSchema",
  fetchParams: DomainManyQueriesWithDeploymentUuid,
};

export interface DomainModelGetSingleSelectQueryJzodSchemaQueryParams extends DomainModelRootQuery {
  queryType: "getSingleSelectQueryJzodSchema",
  singleSelectQuery: DomainSingleSelectQueryWithDeployment,
};


export type DomainModelQueryJzodSchemaParams =
  | DomainModelGetEntityDefinitionQueryParams
  | DomainModelGetFetchParamJzodSchemaQueryParams
  | DomainModelGetSingleSelectQueryJzodSchemaQueryParams;
;


export type MiroirSelectorQueryParams =
  | DomainSingleSelectQueryWithDeployment
  | DomainModelGetSingleSelectQueryQueryParams
  | DomainManyQueriesWithDeploymentUuid
  | LocalCacheQueryParams
  | MiroirCustomQueryParams
  | DomainModelQueryJzodSchemaParams
;
