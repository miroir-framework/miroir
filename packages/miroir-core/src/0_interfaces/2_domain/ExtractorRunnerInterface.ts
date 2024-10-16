import {
  ActionReturnType,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainElementObjectOrFailed,
  ExtractorTemplateForDomainModel,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaForExtractorTemplate,
  DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate,
  DomainModelQueryTemplateJzodSchemaParams,
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
  QueryAction,
  DomainModelGetFetchParamJzodSchemaForExtractor,
  DomainModelGetSingleSelectQueryJzodSchemaForExtractor,
  DomainModelQueryJzodSchemaParams,
  ExtendedTransformerForRuntime
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
// ################################################################################################
// ################################################################################################
export interface SyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends ExtractorTemplateForDomainModel, StateType> {
  extractorRunnerMap?: SyncExtractorTemplateRunnerMap<StateType>
  extractorTemplate: ExtractorTemplateDomainModelType
}

// ################################################################################################
export interface AsyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends ExtractorTemplateForDomainModel> {
  extractorRunnerMap?: AsyncExtractorTemplateRunnerMap
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
export type AsyncExtractorTemplateRunnerMap = {
  extractorType: "async",
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
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;

  // 
  applyExtractorTransformer(
    query: ExtendedTransformerForRuntime,
    queryParams: Record<string, any>,
    newFetchedData: Record<string, any>,
    extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>
  ): Promise<DomainElement>;
  // applyExtractorTransformer(
  //   query: ExtendedTransformerForRuntime,
  //   queryParams: Record<string, any>,
  //   newFetchedData: Record<string, any>,
  //   extractorTemplates: Record<string, ExtractorTemplateForSingleObjectList | ExtractorTemplateForSingleObject | ExtractorTemplateForRecordOfExtractors>,
  // ): Promise<DomainElement>

  // 
  extractWithExtractorTemplate: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObject | ExtractorTemplateForSingleObjectList | ExtractorTemplateForRecordOfExtractors,
    DomainElement
  >,
  extractWithManyExtractorTemplates: AsyncExtractorTemplateRunner<
    ExtractorTemplateForRecordOfExtractors,
    DomainElementObjectOrFailed
  >,
  extractEntityInstanceUuidIndexForTemplate: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >,
  extractEntityInstanceForTemplate: AsyncExtractorTemplateRunner<ExtractorTemplateForSingleObject, DomainElementEntityInstanceOrFailed>;
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >,
  applyExtractorTemplateTransformer(
    query: ExtendedTransformerForRuntime,
    queryParams: Record<string, any>,
    newFetchedData: Record<string, any>,
    extractorTemplates: Record<
      string,
      ExtractorTemplateForSingleObjectList | ExtractorTemplateForSingleObject | ExtractorTemplateForRecordOfExtractors
    >
  ): Promise<DomainElement>;
};

// ################################################################################################
export type SyncExtractorTemplateRunnerMap<StateType> = {
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
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: SyncExtractorRunner<
    ExtractorForSingleObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  // ################################################################################################
  extractWithExtractorTemplate: SyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObject | ExtractorTemplateForSingleObjectList | ExtractorTemplateForRecordOfExtractors,
    StateType,
    DomainElement
  >;
  extractWithManyExtractorTemplates: SyncExtractorTemplateRunner<
    ExtractorTemplateForRecordOfExtractors,
    StateType,
    DomainElementObjectOrFailed
  >;
  extractEntityInstanceUuidIndexForTemplate: SyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceForTemplate: SyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObject,
    StateType,
    DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: SyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
};

// ################################################################################################
export type ExtractorTemplateRunnerMap<StateType> = AsyncExtractorTemplateRunnerMap | SyncExtractorTemplateRunnerMap<StateType>;

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
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: AsyncExtractorRunner<
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
  extractWithExtractorTemplate: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObject | ExtractorTemplateForSingleObjectList | ExtractorTemplateForRecordOfExtractors,
    DomainElement
  >;
  extractWithManyExtractorTemplates: AsyncExtractorTemplateRunner<
    ExtractorTemplateForRecordOfExtractors,
    DomainElementObjectOrFailed
  >;
  extractEntityInstanceUuidIndexForTemplate: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceForTemplate: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObject,
    DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  applyExtractorTemplateTransformer(
    query: ExtendedTransformerForRuntime,
    queryParams: Record<string, any>,
    newFetchedData: Record<string, any>,
    extractorTemplates: Record<
      string,
      ExtractorTemplateForSingleObjectList | ExtractorTemplateForSingleObject | ExtractorTemplateForRecordOfExtractors
    >
  ): Promise<DomainElement>;
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
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: SyncExtractorRunner<
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
  handleQuery(query: QueryAction): Promise<ActionReturnType>;
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

