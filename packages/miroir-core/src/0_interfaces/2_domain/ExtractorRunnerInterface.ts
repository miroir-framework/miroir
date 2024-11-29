import {
  ActionReturnType,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  DomainModelQueryJzodSchemaParams,
  DomainModelQueryTemplateJzodSchemaParams,
  ExtendedTransformerForRuntime,
  QueryByEntityUuidGetEntityDefinition,
  QueryByQuery2GetParamJzodSchema,
  QueryByQueryGetParamJzodSchema,
  QueryByQueryTemplateGetParamJzodSchema,
  QueryByTemplateGetParamJzodSchema,
  QueryDEFUNCT,
  QueryTemplateDEFUNCT,
  JzodElement,
  JzodObject,
  RunQueryOrExtractorAction,
  QueryForExtractorOrCombinerReturningObject,
  QueryForExtractorOrCombinerReturningObjectList,
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  RunQueryTemplateOrExtractorTemplateAction,
  QueryTemplateWithExtractorCombinerTransformer,
  QueryWithExtractorCombinerTransformer
} from "../1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
// ################################################################################################
// TEMPLATES         ##############################################################################
export interface SyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends QueryTemplateDEFUNCT, StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractorOrCombinerTemplate: ExtractorTemplateDomainModelType
}

// ################################################################################################
export interface AsyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends QueryTemplateDEFUNCT> {
  extractorRunnerMap?: AsyncQueryRunnerMap
  extractorOrCombinerTemplate: ExtractorTemplateDomainModelType
}
// ################################################################################################
export type SyncExtractorTemplateRunner<QueryType extends QueryTemplateDEFUNCT, StateType, ResultType> = (
  state: StateType,
  extractorAndParams: SyncExtractorTemplateRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorTemplateRunner<QueryType extends QueryTemplateDEFUNCT, ResultType> = (
  extractorAndParams: AsyncExtractorTemplateRunnerParams<QueryType>
) => Promise<ResultType>;

// ################################################################################################
export type ExtractorTemplateRunner<QueryType extends QueryTemplateDEFUNCT, StateType, ResultType> =
  | SyncExtractorTemplateRunner<QueryType, StateType, ResultType>
  | AsyncExtractorTemplateRunner<QueryType, ResultType>;

// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateForServerONLY(query: RunQueryTemplateOrExtractorTemplateAction): Promise<ActionReturnType>;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// EXTRACTORS  ####################################################################################
export interface SyncExtractorOrQueryRunnerParams<ExtractorDomainModelType extends QueryDEFUNCT, StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractor: ExtractorDomainModelType
}

// ################################################################################################
export interface AsyncExtractorOrQueryRunnerParams<ExtractorDomainModelType extends QueryDEFUNCT> {
  extractorRunnerMap?: AsyncQueryRunnerMap
  extractor: ExtractorDomainModelType
}
// ################################################################################################
export type SyncExtractorOrQueryRunner<QueryType extends QueryDEFUNCT, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorOrQueryRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorOrQueryRunner<QueryType extends QueryDEFUNCT, ResultType> = (
  extractorAndParams: AsyncExtractorOrQueryRunnerParams<QueryType>
) => Promise<ResultType>;

// ################################################################################################
export type ExtractorRunner<QueryType extends QueryDEFUNCT, StateType, ResultType> =
  | SyncExtractorOrQueryRunner<QueryType, StateType, ResultType>
  | AsyncExtractorOrQueryRunner<QueryType, ResultType>;

// ################################################################################################
export type AsyncQueryRunnerMap = {
  extractorType: "async";
  extractWithExtractor: AsyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectOrObjectList | QueryWithExtractorCombinerTransformer,
    DomainElement
  >;
  runQuery: AsyncExtractorOrQueryRunner<QueryWithExtractorCombinerTransformer, DomainElementObjectOrFailed>;
  extractEntityInstance: AsyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObject,
    DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndex: AsyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceList: AsyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    DomainElementInstanceArrayOrFailed
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractor: AsyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceListWithObjectListExtractor: AsyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    DomainElementInstanceArrayOrFailed
  >;
  //
  // TODO: called in AsyncQuerySelector
  applyExtractorTransformer(
    query: ExtendedTransformerForRuntime,
    queryParams: Record<string, any>,
    newFetchedData: Record<string, any>,
    extractors: Record<
      string,
      | QueryForExtractorOrCombinerReturningObjectList
      | QueryForExtractorOrCombinerReturningObject
      | QueryWithExtractorCombinerTransformer
    >
  ): Promise<DomainElement>;
  // ################################################################################################
  extractWithManyExtractorTemplates: AsyncExtractorTemplateRunner<
    QueryTemplateWithExtractorCombinerTransformer,
    DomainElementObjectOrFailed
  >;
};

// ################################################################################################
export type SyncExtractorOrQueryRunnerMap<StateType> = {
  extractorType: "sync";
  extractWithExtractor: SyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObject | QueryForExtractorOrCombinerReturningObjectList | QueryWithExtractorCombinerTransformer,
    StateType,
    DomainElement
  >;
  runQuery: SyncExtractorOrQueryRunner<
    QueryWithExtractorCombinerTransformer,
    StateType,
    DomainElementObjectOrFailed
  >;
  extractEntityInstance: SyncExtractorOrQueryRunner<QueryForExtractorOrCombinerReturningObject, StateType, DomainElementEntityInstanceOrFailed>;
  extractEntityInstanceUuidIndex: SyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractor: SyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceList: SyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceArrayOrFailed
  >;
  extractEntityInstanceListWithObjectListExtractor: SyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceArrayOrFailed
  >;
  // ################################################################################################
  // TODO: has direct call in ReportView, ReportSectionListDisplay, JzodObjectEditor
  extractWithManyExtractorTemplates: SyncExtractorTemplateRunner<
    QueryTemplateWithExtractorCombinerTransformer,
    StateType,
    DomainElementObjectOrFailed
  >;
};

// ################################################################################################
export type ExtractorRunnerMap<StateType> = AsyncQueryRunnerMap | SyncExtractorOrQueryRunnerMap<StateType>;

// // ################################################################################################
// export type GenericQuerySelector<ExtractorType extends QueryTemplateDEFUNCT, StateType, ResultType> = (
//   domainState: StateType,
//   params: SyncExtractorTemplateRunnerParams<ExtractorType, StateType>
// ) => ResultType;

// ################################################################################################
export interface ExtractorPersistenceStoreRunner {
  handleQueryAction(query: RunQueryOrExtractorAction): Promise<ActionReturnType>;
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
  extractEntityJzodSchema: JzodSchemaQueryTemplateSelector<QueryByEntityUuidGetEntityDefinition, StateType>;
  extractFetchQueryJzodSchema: JzodSchemaQueryTemplateSelector<
    QueryByTemplateGetParamJzodSchema,
    StateType
  >;
  extractzodSchemaForSingleSelectQuery: JzodSchemaQueryTemplateSelector<
    QueryByQueryTemplateGetParamJzodSchema,
    StateType
  >;
};

// ################################################################################################
export type ExtractorRunnerMapForJzodSchema<StateType> = {
  extractJzodSchemaForDomainModelQuery: JzodSchemaQuerySelector<DomainModelQueryJzodSchemaParams, StateType>;
  extractEntityJzodSchema: JzodSchemaQuerySelector<QueryByEntityUuidGetEntityDefinition, StateType>;
  extractFetchQueryJzodSchema: JzodSchemaQuerySelector<QueryByQuery2GetParamJzodSchema, StateType>;
  extractzodSchemaForSingleSelectQuery: JzodSchemaQuerySelector<
    QueryByQueryGetParamJzodSchema,
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

