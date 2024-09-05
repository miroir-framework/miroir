import {
  ActionReturnType,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainElementObjectOrFailed,
  DomainModelExtractor,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaExtractor,
  DomainModelGetSingleSelectQueryJzodSchemaExtractor,
  DomainModelQueryJzodSchemaParams,
  ExtractorForRecordOfExtractors,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  JzodElement,
  JzodObject,
  QueryAction,
  TransformerForRuntime
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
export interface SyncExtractorRunnerParams<DomainModelExtractorType extends DomainModelExtractor, StateType> {
  extractorRunnerMap?: SyncExtractorRunnerMap<StateType>
  extractor: DomainModelExtractorType
}

// ################################################################################################
export interface AsyncExtractorRunnerParams<DomainModelExtractorType extends DomainModelExtractor> {
  extractorRunnerMap?: AsyncExtractorRunnerMap
  extractor: DomainModelExtractorType
}
// ################################################################################################
export type SyncExtractorRunner<QueryType extends DomainModelExtractor, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorRunner<QueryType extends DomainModelExtractor, ResultType> = (
  extractorAndParams: AsyncExtractorRunnerParams<QueryType>
) => Promise<ResultType>;
// // ################################################################################################
// export type AsyncExtractorRunner<QueryType extends DomainModelExtractor, ResultType> = (
//   extractorAndParams: AsyncExtractorRunnerParams<QueryType>
// ) => Promise<ResultType>;

// ################################################################################################
export type ExtractorRunner<QueryType extends DomainModelExtractor, StateType, ResultType> =
  | SyncExtractorRunner<QueryType, StateType, ResultType>
  | AsyncExtractorRunner<QueryType, ResultType>;

// ################################################################################################
export type AsyncExtractorRunnerMap = {
  extractorType: "async",
  extractWithExtractor: AsyncExtractorRunner<
    ExtractorForSingleObject | ExtractorForSingleObjectList | ExtractorForRecordOfExtractors,
    DomainElement
  >,
  extractWithManyExtractors: AsyncExtractorRunner<
    ExtractorForRecordOfExtractors,
    DomainElementObjectOrFailed
  >,
  extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >,
  extractEntityInstance: AsyncExtractorRunner<ExtractorForSingleObject, DomainElementEntityInstanceOrFailed>;
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >,
  applyExtractorTransformer(
    query: TransformerForRuntime,
    queryParams: Record<string, any>,
    newFetchedData: Record<string, any>,
    // queryParams: DomainElementObject,
    // newFetchedData: DomainElementObject,
    extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>,
  ): Promise<DomainElement>
};

// ################################################################################################
export type SyncExtractorRunnerMap<StateType> = {
  extractorType: "sync",
  extractWithExtractor: SyncExtractorRunner<ExtractorForSingleObject | ExtractorForSingleObjectList | ExtractorForRecordOfExtractors, StateType, DomainElement>
  extractWithManyExtractors: SyncExtractorRunner<ExtractorForRecordOfExtractors, StateType, DomainElementObjectOrFailed>
  extractEntityInstanceUuidIndex: SyncExtractorRunner<ExtractorForSingleObjectList, StateType, DomainElementInstanceUuidIndexOrFailed>,
  extractEntityInstance: SyncExtractorRunner<ExtractorForSingleObject, StateType, DomainElementEntityInstanceOrFailed>,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: SyncExtractorRunner<ExtractorForSingleObjectList, StateType, DomainElementInstanceUuidIndexOrFailed>,
};

// ################################################################################################
export type ExtractorRunnerMap<StateType> = AsyncExtractorRunnerMap | SyncExtractorRunnerMap<StateType>;

// // ################################################################################################
// export type GenericQuerySelector<ExtractorType extends DomainModelExtractor, StateType, ResultType> = (
//   domainState: StateType,
//   params: SyncExtractorRunnerParams<ExtractorType, StateType>
// ) => ResultType;

// ################################################################################################
export interface PersistenceStoreExtractorRunner {
  // handleQuery(section: ApplicationSection, query: QueryAction): Promise<ActionReturnType>;
  handleQuery(query: QueryAction): Promise<ActionReturnType>;
  extractEntityInstance:AsyncExtractorRunner<
    ExtractorForSingleObject, DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorForSingleObjectList, DomainElementInstanceUuidIndexOrFailed
  >
}

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

