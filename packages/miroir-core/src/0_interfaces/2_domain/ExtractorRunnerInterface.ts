import {
  ActionReturnType,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  ExtractorByEntityUuidGetEntityDefinition,
  ExtractorByExtractorGetParamJzodSchema,
  ExtractorByTemplateGetParamJzodSchema,
  ExtractorByQueryGetParamJzodSchema,
  ExtractorByQueryTemplateGetParamJzodSchema,
  DomainModelQueryJzodSchemaParams,
  DomainModelQueryTemplateJzodSchemaParams,
  ExtendedTransformerForRuntime,
  ExtractorForDomainModelDEFUNCT,
  QueryWithExtractorCombinerTransformer,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  ExtractorTemplateForDomainModelDEFUNCT,
  ExtractorTemplateForRecordOfExtractors,
  JzodElement,
  JzodObject,
  QueryAction,
  QueryTemplateAction
} from "../1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
// ################################################################################################
// TEMPLATES         ##############################################################################
export interface SyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends ExtractorTemplateForDomainModelDEFUNCT, StateType> {
  extractorRunnerMap?: SyncExtractorRunnerMap<StateType>
  extractorTemplate: ExtractorTemplateDomainModelType
}

// ################################################################################################
export interface AsyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends ExtractorTemplateForDomainModelDEFUNCT> {
  extractorRunnerMap?: AsyncExtractorRunnerMap
  extractorTemplate: ExtractorTemplateDomainModelType
}
// ################################################################################################
export type SyncExtractorTemplateRunner<QueryType extends ExtractorTemplateForDomainModelDEFUNCT, StateType, ResultType> = (
  state: StateType,
  extractorAndParams: SyncExtractorTemplateRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorTemplateRunner<QueryType extends ExtractorTemplateForDomainModelDEFUNCT, ResultType> = (
  extractorAndParams: AsyncExtractorTemplateRunnerParams<QueryType>
) => Promise<ResultType>;

// ################################################################################################
export type ExtractorTemplateRunner<QueryType extends ExtractorTemplateForDomainModelDEFUNCT, StateType, ResultType> =
  | SyncExtractorTemplateRunner<QueryType, StateType, ResultType>
  | AsyncExtractorTemplateRunner<QueryType, ResultType>;

// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateForServerONLY(query: QueryTemplateAction): Promise<ActionReturnType>;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// EXTRACTORS  ####################################################################################
export interface SyncExtractorRunnerParams<ExtractorDomainModelType extends ExtractorForDomainModelDEFUNCT, StateType> {
  extractorRunnerMap?: SyncExtractorRunnerMap<StateType>
  extractor: ExtractorDomainModelType
}

// ################################################################################################
export interface AsyncExtractorRunnerParams<ExtractorDomainModelType extends ExtractorForDomainModelDEFUNCT> {
  extractorRunnerMap?: AsyncExtractorRunnerMap
  extractor: ExtractorDomainModelType
}
// ################################################################################################
export type SyncExtractorRunner<QueryType extends ExtractorForDomainModelDEFUNCT, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorRunner<QueryType extends ExtractorForDomainModelDEFUNCT, ResultType> = (
  extractorAndParams: AsyncExtractorRunnerParams<QueryType>
) => Promise<ResultType>;

// ################################################################################################
export type ExtractorRunner<QueryType extends ExtractorForDomainModelDEFUNCT, StateType, ResultType> =
  | SyncExtractorRunner<QueryType, StateType, ResultType>
  | AsyncExtractorRunner<QueryType, ResultType>;

// ################################################################################################
export type AsyncExtractorRunnerMap = {
  extractorType: "async";
  extractWithExtractor: AsyncExtractorRunner<
    ExtractorForSingleObject | ExtractorForSingleObjectList | QueryWithExtractorCombinerTransformer,
    DomainElement
  >;
  extractWithManyExtractors: AsyncExtractorRunner<QueryWithExtractorCombinerTransformer, DomainElementObjectOrFailed>;
  extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceList: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceArrayOrFailed
  >;
  extractEntityInstance: AsyncExtractorRunner<ExtractorForSingleObject, DomainElementEntityInstanceOrFailed>;
  extractEntityInstanceUuidIndexWithObjectListExtractor: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceListWithObjectListExtractor: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceArrayOrFailed
  >;
  // 
  // TODO: called in AsyncQuerySelector
  applyExtractorTransformer(
    query: ExtendedTransformerForRuntime,
    queryParams: Record<string, any>,
    newFetchedData: Record<string, any>,
    extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | QueryWithExtractorCombinerTransformer>
  ): Promise<DomainElement>;
  // ################################################################################################
  extractWithManyExtractorTemplates: AsyncExtractorTemplateRunner<
    ExtractorTemplateForRecordOfExtractors,
    DomainElementObjectOrFailed
  >;
};

// ################################################################################################
export type SyncExtractorRunnerMap<StateType> = {
  extractorType: "sync";
  extractWithExtractor: SyncExtractorRunner<
    ExtractorForSingleObject | ExtractorForSingleObjectList | QueryWithExtractorCombinerTransformer,
    StateType,
    DomainElement
  >;
  extractWithManyExtractors: SyncExtractorRunner<
    QueryWithExtractorCombinerTransformer,
    StateType,
    DomainElementObjectOrFailed
  >;
  extractEntityInstanceUuidIndex: SyncExtractorRunner<
    ExtractorForSingleObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceList: SyncExtractorRunner<
    ExtractorForSingleObjectList,
    StateType,
    DomainElementInstanceArrayOrFailed
  >;
  extractEntityInstance: SyncExtractorRunner<ExtractorForSingleObject, StateType, DomainElementEntityInstanceOrFailed>;
  extractEntityInstanceUuidIndexWithObjectListExtractor: SyncExtractorRunner<
    ExtractorForSingleObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceListWithObjectListExtractor: SyncExtractorRunner<
    ExtractorForSingleObjectList,
    StateType,
    DomainElementInstanceArrayOrFailed
  >;
  // ################################################################################################
  // TODO: has direct call in ReportView, ReportSectionListDisplay, JzodObjectEditor
  extractWithManyExtractorTemplates: SyncExtractorTemplateRunner<
    ExtractorTemplateForRecordOfExtractors,
    StateType,
    DomainElementObjectOrFailed
  >;
};

// ################################################################################################
export type ExtractorRunnerMap<StateType> = AsyncExtractorRunnerMap | SyncExtractorRunnerMap<StateType>;

// // ################################################################################################
// export type GenericQuerySelector<ExtractorType extends ExtractorTemplateForDomainModelDEFUNCT, StateType, ResultType> = (
//   domainState: StateType,
//   params: SyncExtractorTemplateRunnerParams<ExtractorType, StateType>
// ) => ResultType;

// ################################################################################################
export interface ExtractorPersistenceStoreRunner {
  handleQueryAction(query: QueryAction): Promise<ActionReturnType>;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export type ExtractorTemplateRunnerMapForJzodSchema<StateType> = {
  extractJzodSchemaForDomainModelQuery: JzodSchemaQueryTemplateSelector<
    DomainModelQueryTemplateJzodSchemaParams,
    StateType
  >;
  extractEntityJzodSchema: JzodSchemaQueryTemplateSelector<ExtractorByEntityUuidGetEntityDefinition, StateType>;
  extractFetchQueryJzodSchema: JzodSchemaQueryTemplateSelector<
    ExtractorByTemplateGetParamJzodSchema,
    StateType
  >;
  extractzodSchemaForSingleSelectQuery: JzodSchemaQueryTemplateSelector<
    ExtractorByQueryTemplateGetParamJzodSchema,
    StateType
  >;
};

// ################################################################################################
export type ExtractorRunnerMapForJzodSchema<StateType> = {
  extractJzodSchemaForDomainModelQuery: JzodSchemaQuerySelector<DomainModelQueryJzodSchemaParams, StateType>;
  extractEntityJzodSchema: JzodSchemaQuerySelector<ExtractorByEntityUuidGetEntityDefinition, StateType>;
  extractFetchQueryJzodSchema: JzodSchemaQuerySelector<ExtractorByExtractorGetParamJzodSchema, StateType>;
  extractzodSchemaForSingleSelectQuery: JzodSchemaQuerySelector<
    ExtractorByQueryGetParamJzodSchema,
    StateType
  >;
};

// ################################################################################################
export interface ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams, StateType> {
  extractorRunnerMap: ExtractorTemplateRunnerMapForJzodSchema<StateType>
  query: QueryTemplateType
}

// ################################################################################################
export interface ExtractorRunnerParamsForJzodSchema<QueryType extends DomainModelQueryJzodSchemaParams, StateType> {
  extractorRunnerMap: ExtractorRunnerMapForJzodSchema<StateType>
  query: QueryType
}

// ################################################################################################
export type JzodSchemaQueryTemplateSelector<QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams, StateType> = (
  domainState: StateType,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType, StateType>
) => RecordOfJzodElement | JzodElement | undefined;

// ################################################################################################
export type JzodSchemaQuerySelector<QueryType extends DomainModelQueryJzodSchemaParams, StateType> = (
  domainState: StateType,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, StateType>
) => RecordOfJzodElement | JzodElement | undefined;

