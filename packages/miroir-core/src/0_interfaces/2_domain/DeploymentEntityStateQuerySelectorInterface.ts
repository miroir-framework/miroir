import {
  DomainElement,
  DomainElementObject,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelGetSingleSelectQueryJzodSchemaQueryParams,
  DomainModelQueryJzodSchemaParams,
  JzodElement,
  JzodObject,
  MiroirSelectorQueryParams
} from "../1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
export type QuerySelectorMap<QueryType extends MiroirSelectorQueryParams, StateType> = {
  selectEntityInstanceUuidIndex: QuerySelector<QueryType, StateType, DomainElement>,
  selectEntityInstanceFromObjectQuery: QuerySelector<QueryType, StateType, DomainElement>,
  selectEntityInstanceListFromListQuery: QuerySelector<QueryType, StateType, DomainElement>,
  selectByDomainManyQueries: QuerySelector<QueryType, StateType, DomainElementObject>
};

// ################################################################################################
export interface QuerySelectorParams<QueryType extends MiroirSelectorQueryParams, StateType> {
  selectorMap?: QuerySelectorMap<QueryType, StateType>
  query: QueryType
}

// ################################################################################################
export type QuerySelector<QueryType extends MiroirSelectorQueryParams, StateType, ResultType> = (
  domainState: StateType,
  params: QuerySelectorParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type JzodSchemaQuerySelectorMap<StateType> = {
  selectJzodSchemaByDomainModelQuery: JzodSchemaQuerySelector<DomainModelQueryJzodSchemaParams, StateType>,
  selectEntityJzodSchema: JzodSchemaQuerySelector<DomainModelGetEntityDefinitionQueryParams, StateType>,
  selectFetchQueryJzodSchema: JzodSchemaQuerySelector<DomainModelGetFetchParamJzodSchemaQueryParams, StateType>,
  selectJzodSchemaBySingleSelectQuery: JzodSchemaQuerySelector<DomainModelGetSingleSelectQueryJzodSchemaQueryParams, StateType>,
};

// ################################################################################################
export interface JzodSchemaQuerySelectorParams<QueryType extends DomainModelQueryJzodSchemaParams, StateType> {
  selectorMap: JzodSchemaQuerySelectorMap<StateType>
  query: QueryType
}

// ################################################################################################
export type JzodSchemaQuerySelector<QueryType extends DomainModelQueryJzodSchemaParams, StateType> = (
  domainState: StateType,
  params: JzodSchemaQuerySelectorParams<QueryType, StateType>
) => RecordOfJzodElement | JzodElement | undefined;

