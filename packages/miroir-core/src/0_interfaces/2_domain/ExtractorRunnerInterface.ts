import {
  ActionReturnType,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainElementObjectOrFailed,
  ExtractorTemplateForDomainModel,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaExtractor,
  DomainModelGetSingleSelectQueryJzodSchemaExtractor,
  DomainModelQueryJzodSchemaParams,
  ExtractorTemplateForRecordOfExtractors,
  ExtractorTemplateForSingleObject,
  ExtractorTemplateForSingleObjectList,
  JzodElement,
  JzodObject,
  QueryAction,
  TransformerForRuntime
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
export interface SyncExtractorRunnerParams<DomainModelExtractorType extends ExtractorTemplateForDomainModel, StateType> {
  extractorRunnerMap?: SyncExtractorRunnerMap<StateType>
  extractor: DomainModelExtractorType
}

// ################################################################################################
export interface AsyncExtractorRunnerParams<DomainModelExtractorType extends ExtractorTemplateForDomainModel> {
  extractorRunnerMap?: AsyncExtractorRunnerMap
  extractor: DomainModelExtractorType
}
// ################################################################################################
export type SyncExtractorRunner<QueryType extends ExtractorTemplateForDomainModel, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorRunner<QueryType extends ExtractorTemplateForDomainModel, ResultType> = (
  extractorAndParams: AsyncExtractorRunnerParams<QueryType>
) => Promise<ResultType>;
// // ################################################################################################
// export type AsyncExtractorRunner<QueryType extends ExtractorTemplateForDomainModel, ResultType> = (
//   extractorAndParams: AsyncExtractorRunnerParams<QueryType>
// ) => Promise<ResultType>;

// ################################################################################################
export type ExtractorRunner<QueryType extends ExtractorTemplateForDomainModel, StateType, ResultType> =
  | SyncExtractorRunner<QueryType, StateType, ResultType>
  | AsyncExtractorRunner<QueryType, ResultType>;

// ################################################################################################
export type AsyncExtractorRunnerMap = {
  extractorType: "async",
  extractWithExtractor: AsyncExtractorRunner<
    ExtractorTemplateForSingleObject | ExtractorTemplateForSingleObjectList | ExtractorTemplateForRecordOfExtractors,
    DomainElement
  >,
  extractWithManyExtractors: AsyncExtractorRunner<
    ExtractorTemplateForRecordOfExtractors,
    DomainElementObjectOrFailed
  >,
  extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >,
  extractEntityInstance: AsyncExtractorRunner<ExtractorTemplateForSingleObject, DomainElementEntityInstanceOrFailed>;
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: AsyncExtractorRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >,
  applyExtractorTransformer(
    query: TransformerForRuntime,
    queryParams: Record<string, any>,
    newFetchedData: Record<string, any>,
    // queryParams: DomainElementObject,
    // newFetchedData: DomainElementObject,
    extractors: Record<string, ExtractorTemplateForSingleObjectList | ExtractorTemplateForSingleObject | ExtractorTemplateForRecordOfExtractors>,
  ): Promise<DomainElement>
};

// ################################################################################################
export type SyncExtractorRunnerMap<StateType> = {
  extractorType: "sync",
  extractWithExtractor: SyncExtractorRunner<ExtractorTemplateForSingleObject | ExtractorTemplateForSingleObjectList | ExtractorTemplateForRecordOfExtractors, StateType, DomainElement>
  extractWithManyExtractors: SyncExtractorRunner<ExtractorTemplateForRecordOfExtractors, StateType, DomainElementObjectOrFailed>
  extractEntityInstanceUuidIndex: SyncExtractorRunner<ExtractorTemplateForSingleObjectList, StateType, DomainElementInstanceUuidIndexOrFailed>,
  extractEntityInstance: SyncExtractorRunner<ExtractorTemplateForSingleObject, StateType, DomainElementEntityInstanceOrFailed>,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: SyncExtractorRunner<ExtractorTemplateForSingleObjectList, StateType, DomainElementInstanceUuidIndexOrFailed>,
};

// ################################################################################################
export type ExtractorRunnerMap<StateType> = AsyncExtractorRunnerMap | SyncExtractorRunnerMap<StateType>;

// // ################################################################################################
// export type GenericQuerySelector<ExtractorType extends ExtractorTemplateForDomainModel, StateType, ResultType> = (
//   domainState: StateType,
//   params: SyncExtractorRunnerParams<ExtractorType, StateType>
// ) => ResultType;

// ################################################################################################
export interface PersistenceStoreExtractorRunner {
  // handleQuery(section: ApplicationSection, query: QueryAction): Promise<ActionReturnType>;
  handleQuery(query: QueryAction): Promise<ActionReturnType>;
  extractEntityInstance:AsyncExtractorRunner<
    ExtractorTemplateForSingleObject, DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorTemplateForSingleObjectList, DomainElementInstanceUuidIndexOrFailed
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

