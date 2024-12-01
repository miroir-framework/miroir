import {
  ActionReturnType,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  DomainModelQueryTemplateJzodSchemaParams,
  ExtendedTransformerForRuntime,
  ExtractorOrCombiner,
  ExtractorOrCombinerReturningObjectOrObjectList,
  JzodElement,
  JzodObject,
  MiroirQuery,
  QueryByEntityUuidGetEntityDefinition,
  QueryByQuery2GetParamJzodSchema,
  QueryByQueryGetParamJzodSchema,
  QueryByQueryTemplateGetParamJzodSchema,
  QueryByTemplateGetParamJzodSchema,
  QueryForExtractorOrCombinerReturningObject,
  QueryForExtractorOrCombinerReturningObjectList,
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  QueryJzodSchemaParams,
  MiroirQueryTemplate,
  QueryTemplateWithExtractorCombinerTransformer,
  QueryWithExtractorCombinerTransformer,
  RunExtractorOrQueryAction,
  RunQueryTemplateOrExtractorTemplateAction,
  QueryTemplateReturningObjectOrObjectList
} from "../1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
// ################################################################################################
// TEMPLATES         ##############################################################################
export interface SyncExtractorTemplateRunnerParams<
  ExtractorTemplate extends QueryTemplateReturningObjectOrObjectList,
  StateType
> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>;
  extractorOrCombinerTemplate: ExtractorTemplate;
}

export interface SyncQueryTemplateRunnerParams<
  QueryTemplate extends QueryTemplateWithExtractorCombinerTransformer,
  StateType
> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>;
  extractorOrCombinerTemplate: QueryTemplate;
}

export interface SyncExtractorOrQueryTemplateRunnerParams<ExtractorOrQueryTemplate extends MiroirQueryTemplate, StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractorOrCombinerTemplate: ExtractorOrQueryTemplate
}

// ################################################################################################
export interface AsyncExtractorOrQueryTemplateRunnerParams<ExtractorTemplateDomainModelType extends MiroirQueryTemplate> {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractorOrCombinerTemplate: ExtractorTemplateDomainModelType
}
// ################################################################################################
export type SyncQueryTemplateRunner<
  QueryType extends QueryTemplateWithExtractorCombinerTransformer,
  StateType,
  ResultType
> = (state: StateType, extractorAndParams: SyncExtractorOrQueryTemplateRunnerParams<QueryType, StateType>) => ResultType;

// export type SyncExtractorOrQueryTemplateRunner<QueryType extends MiroirQueryTemplate, StateType, ResultType> = (
//   state: StateType,
//   extractorAndParams: SyncExtractorOrQueryTemplateRunnerParams<QueryType, StateType>
// ) => ResultType;

export type SyncExtractorTemplateRunner<
  QueryType extends QueryTemplateReturningObjectOrObjectList,
  StateType,
  ResultType
> = (state: StateType, extractorAndParams: SyncExtractorTemplateRunnerParams<QueryType, StateType>) => ResultType;

export type SyncExtractorOrQueryTemplateRunner<QueryType extends MiroirQueryTemplate, StateType, ResultType> = (
  state: StateType,
  extractorAndParams: SyncExtractorOrQueryTemplateRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
export type AsyncExtractorOrQueryTemplateRunner<QueryType extends MiroirQueryTemplate, ResultType> = (
  extractorAndParams: AsyncExtractorOrQueryTemplateRunnerParams<QueryType>
) => Promise<ResultType>;

// ################################################################################################
// export type ExtractorTemplateRunner<QueryType extends MiroirQueryTemplate, StateType, ResultType> =
export type ExtractorTemplateRunner<QueryType extends QueryTemplateWithExtractorCombinerTransformer, StateType, ResultType> =
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
// export interface SyncExtractorRunnerParams<ExtractorType extends ExtractorOrCombiner, StateType> {
export interface SyncQueryRunnerParams<ExtractorType extends QueryWithExtractorCombinerTransformer, StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractor: ExtractorType
}

export interface SyncExtractorRunnerParams<ExtractorType extends QueryForExtractorOrCombinerReturningObjectOrObjectList, StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractor: ExtractorType
}

export interface SyncExtractorOrQueryRunnerParams<queryType extends MiroirQuery, StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractor: queryType
}

// ################################################################################################
// export interface AsyncExtractorRunnerParams<ExtractorType extends ExtractorOrCombiner> {
export interface AsyncExtractorRunnerParams<ExtractorType extends QueryForExtractorOrCombinerReturningObjectOrObjectList> {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractor: ExtractorType
}

export interface AsyncExtractorOrQueryRunnerParams<ExtractorDomainModelType extends MiroirQuery> {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractor: ExtractorDomainModelType
}
// ################################################################################################
// export type SyncExtractorRunner<QueryType extends ExtractorOrCombiner, StateType, ResultType> = (
export type SyncExtractorRunner<QueryType extends QueryForExtractorOrCombinerReturningObjectOrObjectList, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorRunnerParams<QueryType, StateType>
) => ResultType;

export type SyncExtractorOrQueryRunner<QueryType extends MiroirQuery, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorOrQueryRunnerParams<QueryType, StateType>
) => ResultType;

// ################################################################################################
// export type AsyncExtractorRunner<ExtractorType extends ExtractorOrCombiner, ResultType> = (
export type AsyncExtractorRunner<ExtractorType extends QueryForExtractorOrCombinerReturningObjectOrObjectList, ResultType> = (
  extractorAndParams: AsyncExtractorRunnerParams<ExtractorType>
) => Promise<ResultType>;

export type AsyncExtractorOrQueryRunner<QueryType extends MiroirQuery, ResultType> = (
  extractorAndParams: AsyncExtractorOrQueryRunnerParams<QueryType>
) => Promise<ResultType>;

// ################################################################################################
export type ExtractorOrQueryRunner<QueryType extends MiroirQuery, StateType, ResultType> =
  | SyncExtractorOrQueryRunner<QueryType, StateType, ResultType>
  | AsyncExtractorOrQueryRunner<QueryType, ResultType>;

// ################################################################################################
export type AsyncExtractWithExtractorOrCombinerReturningObjectOrObjectList = AsyncExtractorRunner<
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  DomainElement
>;

export type AsyncExtractorOrQueryRunnerMap = {
  extractorType: "async";
  extractWithExtractorOrCombinerReturningObjectOrObjectList: AsyncExtractWithExtractorOrCombinerReturningObjectOrObjectList;
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
  runQueryTemplateWithExtractorCombinerTransformer: AsyncExtractorOrQueryTemplateRunner<
    QueryTemplateWithExtractorCombinerTransformer,
    DomainElementObjectOrFailed
  >;
};

// ################################################################################################
export type SyncExtractWithExtractorOrCombinerReturningObjectOrObjectList<StateType> = SyncExtractorRunner<
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  StateType,
  DomainElement
>;

export type SyncExtractorOrQueryRunnerMap<StateType> = {
  extractorType: "sync";
  // extractWithExtractorOrCombinerReturningObjectOrObjectList: SyncExtractorOrQueryRunner<
  extractWithExtractorOrCombinerReturningObjectOrObjectList: SyncExtractWithExtractorOrCombinerReturningObjectOrObjectList<StateType>;
  runQuery: SyncExtractorOrQueryRunner<QueryWithExtractorCombinerTransformer, StateType, DomainElementObjectOrFailed>;
  extractEntityInstance: SyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObject,
    StateType,
    DomainElementEntityInstanceOrFailed
  >;
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
  runQueryTemplateWithExtractorCombinerTransformer: SyncExtractorOrQueryTemplateRunner<
    QueryTemplateWithExtractorCombinerTransformer,
    StateType,
    DomainElementObjectOrFailed
  >;
};

// ################################################################################################
export type ExtractorOrQueryRunnerMap<StateType> = AsyncExtractorOrQueryRunnerMap | SyncExtractorOrQueryRunnerMap<StateType>;

// // ################################################################################################
// export type GenericQuerySelector<ExtractorType extends MiroirQueryTemplate, StateType, ResultType> = (
//   domainState: StateType,
//   params: SyncExtractorOrQueryTemplateRunnerParams<ExtractorType, StateType>
// ) => ResultType;

// ################################################################################################
export interface ExtractorOrQueryPersistenceStoreRunner {
  handleQueryAction(query: RunExtractorOrQueryAction): Promise<ActionReturnType>;
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

