import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import { Uuid } from "../1_core/EntityDefinition";
import { ApplicationSection, FetchedData } from "../1_core/preprocessor-generated/miroirFundamentalType";
import {
  MiroirCombineQuery,
  MiroirSelectQueriesRecord,
  MiroirSelectQuery
} from "../1_core/preprocessor-generated/server-generated";

export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;


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

export type LocalCacheQueryParams = {
  type: "LocalCacheEntityInstancesSelectorParams";
  definition: LocalCacheEntityInstancesSelectorParams;
};

export interface DomainModelRootQuery {
  pageParams?: Record<string, any>,
  fetchedData?: FetchedData,
}

export interface DomainManyQueriesParams extends DomainModelRootQuery {
  type: "DomainManyQueries";
  deploymentUuid?: Uuid,
  applicationSection?: ApplicationSection,
  select: MiroirSelectQueriesRecord;
  combine?: MiroirCombineQuery
};

// ################################################################################################
// JZOD SCHEMAs
// ################################################################################################
export interface DomainModelGetEntityDefinitionQueryParams extends DomainModelRootQuery {
  type: "getEntityDefinition",
  deploymentUuid: Uuid,
  entityUuid: Uuid,
};

export interface DomainModelGetFetchParamJzodSchemaQueryParams extends DomainModelRootQuery  {
  type: "getFetchParamsJzodSchema",
  fetchParams: DomainManyQueriesParams,
};

export interface DomainModelGetSingleSelectQueryJzodSchemaQueryParams extends DomainModelRootQuery {
  type: "getSingleSelectQueryJzodSchema",
  singleSelectQuery: DomainSingleSelectQuery,
};

export type DomainModelQueryJzodSchemaParams =
  | DomainModelGetEntityDefinitionQueryParams
  | DomainModelGetFetchParamJzodSchemaQueryParams
  | DomainModelGetSingleSelectQueryJzodSchemaQueryParams;
;


export type MiroirSelectorQueryParams = LocalCacheQueryParams | DomainManyQueriesParams | DomainModelQueryJzodSchemaParams;
