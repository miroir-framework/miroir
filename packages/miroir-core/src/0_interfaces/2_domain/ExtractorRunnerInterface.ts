import {
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  DomainModelExtractor,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaExtractor,
  DomainModelGetSingleSelectQueryJzodSchemaExtractor,
  ExtractorForRecordOfExtractors,
  DomainModelQueryJzodSchemaParams,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  JzodElement,
  JzodObject
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
export interface ExtractorRunnerParams<DomainModelExtractorType extends DomainModelExtractor, StateType> {
  extractorRunnerMap?: ExtractorRunnerMap<StateType>
  extractor: DomainModelExtractorType
}
// ################################################################################################
export type ExtractorRunner<QueryType extends DomainModelExtractor, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: ExtractorRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorRunner<QueryType extends DomainModelExtractor, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: ExtractorRunnerParams<QueryType, StateType>
) => Promise<ResultType>;


// ################################################################################################
export type ExtractorRunnerMap<StateType> = {
  extractWithManyExtractors: ExtractorRunner<ExtractorForRecordOfExtractors, StateType, DomainElementObjectOrFailed>
  extractEntityInstanceUuidIndex: ExtractorRunner<ExtractorForSingleObjectList, StateType, DomainElementInstanceUuidIndexOrFailed>,
  extractEntityInstance: ExtractorRunner<ExtractorForSingleObject, StateType, DomainElementEntityInstanceOrFailed>,
  extractEntityInstanceUuidIndexWithObjectListExtractor: ExtractorRunner<ExtractorForSingleObjectList, StateType, DomainElementInstanceUuidIndexOrFailed>,
};


// // ################################################################################################
// export type GenericQuerySelector<ExtractorType extends DomainModelExtractor, StateType, ResultType> = (
//   domainState: StateType,
//   params: ExtractorRunnerParams<ExtractorType, StateType>
// ) => ResultType;

// ################################################################################################
export type ExtractorRunnerMapForJzodSchema<StateType> = {
  extractJzodSchemaForDomainModelQuery: JzodSchemaQuerySelector<DomainModelQueryJzodSchemaParams, StateType>,
  extractEntityJzodSchema: JzodSchemaQuerySelector<DomainModelGetEntityDefinitionExtractor, StateType>,
  extractFetchQueryJzodSchema: JzodSchemaQuerySelector<DomainModelGetFetchParamJzodSchemaExtractor, StateType>,
  extractzodSchemaForSingleSelectQuery: JzodSchemaQuerySelector<DomainModelGetSingleSelectQueryJzodSchemaExtractor, StateType>,
};

// ################################################################################################
export interface ExtractorRunnerParamsForJzodSchema<QueryType extends DomainModelQueryJzodSchemaParams, StateType> {
  extractorRunnerMap: ExtractorRunnerMapForJzodSchema<StateType>
  query: QueryType
}

// ################################################################################################
export type JzodSchemaQuerySelector<QueryType extends DomainModelQueryJzodSchemaParams, StateType> = (
  domainState: StateType,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, StateType>
) => RecordOfJzodElement | JzodElement | undefined;

