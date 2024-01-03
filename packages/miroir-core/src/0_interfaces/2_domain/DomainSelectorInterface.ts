import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import { Uuid } from "../1_core/EntityDefinition";
import {
  ApplicationSection,
  FetchedData,
  MiroirCombineQuery,
  MiroirCustomQueryParams,
  MiroirSelectQueriesRecord,
  MiroirSelectQuery,
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "./DomainControllerInterface";

export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;


// ################################################################################################
export type DomainStateSelector<P extends MiroirSelectorQueryParams, T> = (
  domainState: DomainState,
  params: P
  // params: MiroirSelectorQueryParams
) => T;

// ################################################################################################
export interface DomainModelRootQuery {
  pageParams?: Record<string, any>,
  fetchedData?: FetchedData,
}

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
export type DomainSingleSelectQueryWithDeployment = {
  queryType: "domainSingleSelectQueryWithDeployment"
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  select: MiroirSelectQuery;
}

export interface DomainModelGetSingleSelectQueryQueryParams extends DomainModelRootQuery {
  queryType: "getSingleSelectQuery",
  singleSelectQuery: DomainSingleSelectQueryWithDeployment,
};


// ################################################################################################
export interface DomainManyQueriesParams extends DomainModelRootQuery {
  queryType: "DomainManyQueries";
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  select: MiroirSelectQueriesRecord;
  combine?: MiroirCombineQuery
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
  fetchParams: DomainManyQueriesParams,
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
  | DomainManyQueriesParams
  | LocalCacheQueryParams
  | MiroirCustomQueryParams
  | DomainModelQueryJzodSchemaParams
;
