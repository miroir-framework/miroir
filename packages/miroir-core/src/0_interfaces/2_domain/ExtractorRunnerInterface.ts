import {
  ActionReturnType,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaForExtractor,
  DomainModelGetFetchParamJzodSchemaForExtractorTemplate,
  DomainModelGetSingleSelectQueryJzodSchemaForExtractor,
  DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate,
  DomainModelQueryJzodSchemaParams,
  DomainModelQueryTemplateJzodSchemaParams,
  ExtendedTransformerForRuntime,
  ExtractorForDomainModel,
  ExtractorForRecordOfExtractors,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  ExtractorTemplateForDomainModel,
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
// ################################################################################################
export interface SyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends ExtractorTemplateForDomainModel, StateType> {
  extractorRunnerMap?: SyncExtractorRunnerMap<StateType>
  extractorTemplate: ExtractorTemplateDomainModelType
}

// ################################################################################################
export interface AsyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends ExtractorTemplateForDomainModel> {
  extractorRunnerMap?: AsyncExtractorRunnerMap
  extractorTemplate: ExtractorTemplateDomainModelType
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
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateForServerONLY(query: QueryTemplateAction): Promise<ActionReturnType>;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
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
  extractorType: "async";
  extractWithExtractor: AsyncExtractorRunner<
    ExtractorForSingleObject | ExtractorForSingleObjectList | ExtractorForRecordOfExtractors,
    DomainElement
  >;
  extractWithManyExtractors: AsyncExtractorRunner<ExtractorForRecordOfExtractors, DomainElementObjectOrFailed>;
  extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstance: AsyncExtractorRunner<ExtractorForSingleObject, DomainElementEntityInstanceOrFailed>;
  extractEntityInstanceUuidIndexWithObjectListExtractor: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  // 
  // TODO: called in AsyncQuerySelector
  applyExtractorTransformer(
    query: ExtendedTransformerForRuntime,
    queryParams: Record<string, any>,
    newFetchedData: Record<string, any>,
    extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>
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
    ExtractorForSingleObject | ExtractorForSingleObjectList | ExtractorForRecordOfExtractors,
    StateType,
    DomainElement
  >;
  extractWithManyExtractors: SyncExtractorRunner<
    ExtractorForRecordOfExtractors,
    StateType,
    DomainElementObjectOrFailed
  >;
  extractEntityInstanceUuidIndex: SyncExtractorRunner<
    ExtractorForSingleObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstance: SyncExtractorRunner<ExtractorForSingleObject, StateType, DomainElementEntityInstanceOrFailed>;
  extractEntityInstanceUuidIndexWithObjectListExtractor: SyncExtractorRunner<
    ExtractorForSingleObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
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
// export type GenericQuerySelector<ExtractorType extends ExtractorTemplateForDomainModel, StateType, ResultType> = (
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
  extractEntityJzodSchema: JzodSchemaQueryTemplateSelector<DomainModelGetEntityDefinitionExtractor, StateType>;
  extractFetchQueryJzodSchema: JzodSchemaQueryTemplateSelector<
    DomainModelGetFetchParamJzodSchemaForExtractorTemplate,
    StateType
  >;
  extractzodSchemaForSingleSelectQuery: JzodSchemaQueryTemplateSelector<
    DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate,
    StateType
  >;
};

// ################################################################################################
export type ExtractorRunnerMapForJzodSchema<StateType> = {
  extractJzodSchemaForDomainModelQuery: JzodSchemaQuerySelector<DomainModelQueryJzodSchemaParams, StateType>;
  extractEntityJzodSchema: JzodSchemaQuerySelector<DomainModelGetEntityDefinitionExtractor, StateType>;
  extractFetchQueryJzodSchema: JzodSchemaQuerySelector<DomainModelGetFetchParamJzodSchemaForExtractor, StateType>;
  extractzodSchemaForSingleSelectQuery: JzodSchemaQuerySelector<
    DomainModelGetSingleSelectQueryJzodSchemaForExtractor,
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

