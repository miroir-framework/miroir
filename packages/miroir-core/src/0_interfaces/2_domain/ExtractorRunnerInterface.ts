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
  QueryTemplateAction,
  TransformerForRuntime,
  ExtractorForDomainModel,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  ExtractorForRecordOfExtractors,
  QueryAction
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
// ################################################################################################
// ################################################################################################
export interface SyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends ExtractorTemplateForDomainModel, StateType> {
  extractorRunnerMap?: SyncExtractorTemplateRunnerMap<StateType>
  extractor: ExtractorTemplateDomainModelType
}

// ################################################################################################
export interface AsyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends ExtractorTemplateForDomainModel> {
  extractorRunnerMap?: AsyncExtractorTemplateRunnerMap
  extractor: ExtractorTemplateDomainModelType
}
// ################################################################################################
export type SyncExtractorTemplateRunner<QueryType extends ExtractorTemplateForDomainModel, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorTemplateRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorTemplateRunner<QueryType extends ExtractorTemplateForDomainModel, ResultType> = (
  extractorAndParams: AsyncExtractorTemplateRunnerParams<QueryType>
) => Promise<ResultType>;

// ################################################################################################
export type ExtractorTemplateRunner<QueryType extends ExtractorTemplateForDomainModel, StateType, ResultType> =
  | SyncExtractorTemplateRunner<QueryType, StateType, ResultType>
  | AsyncExtractorTemplateRunner<QueryType, ResultType>;

// ################################################################################################
export type AsyncExtractorTemplateRunnerMap = {
  extractorType: "async",
  extractWithExtractorTemplate: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObject | ExtractorTemplateForSingleObjectList | ExtractorTemplateForRecordOfExtractors,
    DomainElement
  >,
  extractWithManyExtractorTemplates: AsyncExtractorTemplateRunner<
    ExtractorTemplateForRecordOfExtractors,
    DomainElementObjectOrFailed
  >,
  extractEntityInstanceUuidIndex: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >,
  extractEntityInstance: AsyncExtractorTemplateRunner<ExtractorTemplateForSingleObject, DomainElementEntityInstanceOrFailed>;
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: AsyncExtractorTemplateRunner<
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
export type SyncExtractorTemplateRunnerMap<StateType> = {
  extractorType: "sync",
  extractWithExtractorTemplate: SyncExtractorTemplateRunner<ExtractorTemplateForSingleObject | ExtractorTemplateForSingleObjectList | ExtractorTemplateForRecordOfExtractors, StateType, DomainElement>
  extractWithManyExtractorTemplates: SyncExtractorTemplateRunner<ExtractorTemplateForRecordOfExtractors, StateType, DomainElementObjectOrFailed>
  extractEntityInstanceUuidIndex: SyncExtractorTemplateRunner<ExtractorTemplateForSingleObjectList, StateType, DomainElementInstanceUuidIndexOrFailed>,
  extractEntityInstance: SyncExtractorTemplateRunner<ExtractorTemplateForSingleObject, StateType, DomainElementEntityInstanceOrFailed>,
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: SyncExtractorTemplateRunner<ExtractorTemplateForSingleObjectList, StateType, DomainElementInstanceUuidIndexOrFailed>,
};

// ################################################################################################
export type ExtractorTemplateRunnerMap<StateType> = AsyncExtractorTemplateRunnerMap | SyncExtractorTemplateRunnerMap<StateType>;

// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  // handleQueryTemplate(section: ApplicationSection, query: QueryTemplateAction): Promise<ActionReturnType>;
  handleQueryTemplate(query: QueryTemplateAction): Promise<ActionReturnType>;
  extractEntityInstance:AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObject, DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndex: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList, DomainElementInstanceUuidIndexOrFailed
  >
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export interface SyncExtractorRunnerParams<ExtractorDomainModelType extends ExtractorForDomainModel, StateType> {
  extractorRunnerMap?: SyncExtractorRunnerMap<StateType>
  extractor: ExtractorDomainModelType
}

// ################################################################################################
export interface AsyncExtractorRunnerParams<ExtractorDomainModelType extends ExtractorForDomainModel> {
  extractorRunnerMap?: AsyncExtractorRunnerMap
  extractor: ExtractorDomainModelType
}
// ################################################################################################
export type SyncExtractorRunner<QueryType extends ExtractorForDomainModel, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorRunner<QueryType extends ExtractorForDomainModel, ResultType> = (
  extractorAndParams: AsyncExtractorRunnerParams<QueryType>
) => Promise<ResultType>;

// ################################################################################################
export type ExtractorRunner<QueryType extends ExtractorForDomainModel, StateType, ResultType> =
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
// export type GenericQuerySelector<ExtractorType extends ExtractorTemplateForDomainModel, StateType, ResultType> = (
//   domainState: StateType,
//   params: SyncExtractorTemplateRunnerParams<ExtractorType, StateType>
// ) => ResultType;

// ################################################################################################
export interface ExtractorPersistenceStoreRunner {
  // handleQueryTemplate(query: QueryTemplateAction): Promise<ActionReturnType>;
  handleQuery(query: QueryAction): Promise<ActionReturnType>;
  extractEntityInstance:AsyncExtractorRunner<
    ExtractorForSingleObject, DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorForSingleObjectList, DomainElementInstanceUuidIndexOrFailed
  >
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
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

