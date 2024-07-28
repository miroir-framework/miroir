import {
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  DomainModelExtractor,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaExtractor,
  DomainModelGetSingleSelectQueryJzodSchemaExtractor,
  DomainModelManyExtractors,
  DomainModelQueryJzodSchemaParams,
  DomainModelSingleObjectExtractor,
  DomainModelSingleObjectListExtractor,
  JzodElement,
  JzodObject
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
export interface QuerySelectorParams<DomainModelExtractorType extends DomainModelExtractor, StateType> {
  selectorMap?: ExtractorSelectorMap<StateType>
  extractor: DomainModelExtractorType
}
// ################################################################################################
export type ExtractorSelector<QueryType extends DomainModelExtractor, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: QuerySelectorParams<QueryType, StateType>
) => ResultType;


// ################################################################################################
export type ExtractorSelectorMap<StateType> = {
  selectByDomainManyExtractors: ExtractorSelector<DomainModelManyExtractors, StateType, DomainElementObjectOrFailed>
  selectEntityInstanceUuidIndexFromState: ExtractorSelector<DomainModelSingleObjectListExtractor, StateType, DomainElementInstanceUuidIndexOrFailed>,
  selectEntityInstanceFromState: ExtractorSelector<DomainModelSingleObjectExtractor, StateType, DomainElementEntityInstanceOrFailed>,
  selectEntityInstanceUuidIndexFromObjectListExtractor: ExtractorSelector<DomainModelSingleObjectListExtractor, StateType, DomainElementInstanceUuidIndexOrFailed>,
};


// ################################################################################################
export type GenericQuerySelector<QueryType extends DomainModelExtractor, StateType, ResultType> = (
  domainState: StateType,
  params: QuerySelectorParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type JzodSchemaQuerySelectorMap<StateType> = {
  selectJzodSchemaByDomainModelQuery: JzodSchemaQuerySelector<DomainModelQueryJzodSchemaParams, StateType>,
  selectEntityJzodSchema: JzodSchemaQuerySelector<DomainModelGetEntityDefinitionExtractor, StateType>,
  selectFetchQueryJzodSchema: JzodSchemaQuerySelector<DomainModelGetFetchParamJzodSchemaExtractor, StateType>,
  selectJzodSchemaBySingleSelectQuery: JzodSchemaQuerySelector<DomainModelGetSingleSelectQueryJzodSchemaExtractor, StateType>,
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

