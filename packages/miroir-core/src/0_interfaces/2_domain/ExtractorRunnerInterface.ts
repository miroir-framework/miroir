import {
  ActionReturnType,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  QueryJzodSchemaParams,
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
export interface SyncExtractorOrQueryTemplateRunnerParams<ExtractorOrQueryTemplate extends QueryTemplateDEFUNCT, StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractorOrCombinerTemplate: ExtractorOrQueryTemplate
}

// ################################################################################################
export interface AsyncExtractorOrQueryTemplateRunnerParams<ExtractorTemplateDomainModelType extends QueryTemplateDEFUNCT> {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractorOrCombinerTemplate: ExtractorTemplateDomainModelType
}
// ################################################################################################
export type SyncExtractorOrQueryTemplateRunner<QueryType extends QueryTemplateDEFUNCT, StateType, ResultType> = (
  state: StateType,
  extractorAndParams: SyncExtractorOrQueryTemplateRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorOrQueryTemplateRunner<QueryType extends QueryTemplateDEFUNCT, ResultType> = (
  extractorAndParams: AsyncExtractorOrQueryTemplateRunnerParams<QueryType>
) => Promise<ResultType>;

// ################################################################################################
export type ExtractorTemplateRunner<QueryType extends QueryTemplateDEFUNCT, StateType, ResultType> =
  | SyncExtractorOrQueryTemplateRunner<QueryType, StateType, ResultType>
  | AsyncExtractorOrQueryTemplateRunner<QueryType, ResultType>;

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
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
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
export type ExtractorOrQueryRunner<QueryType extends QueryDEFUNCT, StateType, ResultType> =
  | SyncExtractorOrQueryRunner<QueryType, StateType, ResultType>
  | AsyncExtractorOrQueryRunner<QueryType, ResultType>;

// ################################################################################################
export type AsyncExtractorOrQueryRunnerMap = {
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
  extractWithManyExtractorTemplates: AsyncExtractorOrQueryTemplateRunner<
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
  extractWithManyExtractorTemplates: SyncExtractorOrQueryTemplateRunner<
    QueryTemplateWithExtractorCombinerTransformer,
    StateType,
    DomainElementObjectOrFailed
  >;
};

// ################################################################################################
export type ExtractorOrQueryRunnerMap<StateType> = AsyncExtractorOrQueryRunnerMap | SyncExtractorOrQueryRunnerMap<StateType>;

// // ################################################################################################
// export type GenericQuerySelector<ExtractorType extends QueryTemplateDEFUNCT, StateType, ResultType> = (
//   domainState: StateType,
//   params: SyncExtractorOrQueryTemplateRunnerParams<ExtractorType, StateType>
// ) => ResultType;

// ################################################################################################
export interface ExtractorOrQueryPersistenceStoreRunner {
  handleQueryAction(query: RunQueryOrExtractorAction): Promise<ActionReturnType>;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export type QueryTemplateRunnerMapForJzodSchema<StateType> = {
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
export type QueryRunnerMapForJzodSchema<StateType> = {
  extractJzodSchemaForDomainModelQuery: JzodSchemaQuerySelector<QueryJzodSchemaParams, StateType>;
  extractEntityJzodSchema: JzodSchemaQuerySelector<QueryByEntityUuidGetEntityDefinition, StateType>;
  extractFetchQueryJzodSchema: JzodSchemaQuerySelector<QueryByQuery2GetParamJzodSchema, StateType>;
  extractzodSchemaForSingleSelectQuery: JzodSchemaQuerySelector<
    QueryByQueryGetParamJzodSchema,
    StateType
  >;
};

// ################################################################################################
export interface ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams, StateType> {
  extractorRunnerMap: QueryTemplateRunnerMapForJzodSchema<StateType>
  query: QueryTemplateType
}

// ################################################################################################
export interface ExtractorRunnerParamsForJzodSchema<QueryType extends QueryJzodSchemaParams, StateType> {
  extractorRunnerMap: QueryRunnerMapForJzodSchema<StateType>
  query: QueryType
}

// ################################################################################################
export type JzodSchemaQueryTemplateSelector<QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams, StateType> = (
  domainState: StateType,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType, StateType>
) => RecordOfJzodElement | JzodElement | undefined;

// ################################################################################################
export type JzodSchemaQuerySelector<QueryType extends QueryJzodSchemaParams, StateType> = (
  domainState: StateType,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, StateType>
) => RecordOfJzodElement | JzodElement | undefined;

