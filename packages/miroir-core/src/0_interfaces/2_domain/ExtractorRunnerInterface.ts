import {
  ActionReturnType,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObjectOrFailed,
  DomainModelQueryTemplateJzodSchemaParams,
  ExtendedTransformerForRuntime,
  JzodElement,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition,
  QueryByQuery2GetParamJzodSchema,
  QueryByQueryGetParamJzodSchema,
  QueryByQueryTemplateGetParamJzodSchema,
  QueryByTemplateGetParamJzodSchema,
  QueryForExtractorOrCombinerReturningObject,
  QueryForExtractorOrCombinerReturningObjectList,
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  QueryJzodSchemaParams,
  QueryTemplateReturningObjectOrObjectList,
  QueryTemplateWithExtractorCombinerTransformer,
  QueryWithExtractorCombinerTransformer,
  RunExtractorOrQueryAction,
  RunQueryTemplateOrExtractorTemplateAction
} from "../1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateForServerONLY(query: RunQueryTemplateOrExtractorTemplateAction): Promise<ActionReturnType>;
}

// ################################################################################################
export interface ExtractorOrQueryPersistenceStoreRunner {
  handleQueryAction(query: RunExtractorOrQueryAction): Promise<ActionReturnType>;
}

// ################################################################################################
// ################################################################################################
// EXTRACTOR TEMPLATES ############################################################################

export interface SyncExtractorTemplateRunnerParams<
  ExtractorTemplate extends QueryTemplateReturningObjectOrObjectList,
  StateType
> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>;
  extractorOrCombinerTemplate: ExtractorTemplate;
}

export type SyncExtractorTemplateRunner<
  QueryType extends QueryTemplateReturningObjectOrObjectList,
  StateType,
  ResultType
> = (state: StateType, extractorAndParams: SyncExtractorTemplateRunnerParams<QueryType, StateType>) => ResultType;

// ################################################################################################
export interface AsyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends QueryTemplateReturningObjectOrObjectList> {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractorOrCombinerTemplate: ExtractorTemplateDomainModelType
}


// ################################################################################################
export type AsyncExtractorTemplateRunner<QueryType extends QueryTemplateReturningObjectOrObjectList, ResultType> = (
  extractorAndParams: AsyncExtractorTemplateRunnerParams<QueryType>
) => Promise<ResultType>;


// ################################################################################################
export type ExtractorTemplateRunner<QueryType extends QueryTemplateReturningObjectOrObjectList, StateType, ResultType> =
  | SyncExtractorTemplateRunner<QueryType, StateType, ResultType>
  | AsyncExtractorTemplateRunner<QueryType, ResultType>;

// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateForServerONLY(query: RunQueryTemplateOrExtractorTemplateAction): Promise<ActionReturnType>;
}


// ################################################################################################
// ################################################################################################
// EXTRACTORS #####################################################################################
export interface SyncExtractorRunnerParams<ExtractorType extends QueryForExtractorOrCombinerReturningObjectOrObjectList, StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractor: ExtractorType
}

export interface AsyncExtractorRunnerParams<ExtractorType extends QueryForExtractorOrCombinerReturningObjectOrObjectList> {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractor: ExtractorType
}

export type SyncExtractorRunner<QueryType extends QueryForExtractorOrCombinerReturningObjectOrObjectList, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorRunnerParams<QueryType, StateType>
) => ResultType;

export type AsyncExtractorRunner<ExtractorType extends QueryForExtractorOrCombinerReturningObjectOrObjectList, ResultType> = (
  extractorAndParams: AsyncExtractorRunnerParams<ExtractorType>
) => Promise<ResultType>;

export type AsyncExtractWithExtractorOrCombinerReturningObjectOrObjectList = AsyncExtractorRunner<
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  DomainElement
>;

// ################################################################################################
export type SyncExtractWithExtractorOrCombinerReturningObjectOrObjectList<StateType> = SyncExtractorRunner<
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  StateType,
  DomainElement
>;



// ################################################################################################
// ################################################################################################
// QUERY ##########################################################################################
export interface SyncQueryRunnerParams<StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractor: QueryWithExtractorCombinerTransformer
}

// ################################################################################################
export type SyncQueryRunner<
  StateType,
  ResultType
> = (state: StateType, extractorAndParams: SyncQueryRunnerParams<StateType>) => ResultType;

// ################################################################################################
export interface AsyncQueryRunnerParams {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractor: QueryWithExtractorCombinerTransformer
}

// ################################################################################################
export type AsyncQueryRunner<ResultType> = (
  extractorAndParams: AsyncQueryRunnerParams
) => Promise<ResultType>;


// ################################################################################################
// ################################################################################################
// QUERY TEMPLATES ################################################################################
export interface SyncQueryTemplateRunnerParams<StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>;
  extractorOrCombinerTemplate: QueryTemplateWithExtractorCombinerTransformer;
}

// ################################################################################################
export type SyncQueryTemplateRunner<
  StateType,
  ResultType
> = (state: StateType, extractorAndParams: SyncQueryTemplateRunnerParams<StateType>) => ResultType;

// ################################################################################################
export interface AsyncQueryTemplateRunnerParams {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractorOrCombinerTemplate: QueryTemplateWithExtractorCombinerTransformer
}

// ################################################################################################
export type AsyncQueryTemplateRunner<ResultType> = (
  extractorAndParams: AsyncQueryTemplateRunnerParams
) => Promise<ResultType>;


// ################################################################################################
// ################################################################################################
// QUERY OR EXTRACTOR  ############################################################################
export type ExtractorOrQueryRunnerMap<StateType> = AsyncExtractorOrQueryRunnerMap | SyncExtractorOrQueryRunnerMap<StateType>;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// MAPS  ##########################################################################################
export type AsyncExtractorOrQueryRunnerMap = {
  extractorType: "async";
  extractWithExtractorOrCombinerReturningObjectOrObjectList: AsyncExtractWithExtractorOrCombinerReturningObjectOrObjectList;
  runQuery: AsyncQueryRunner<DomainElementObjectOrFailed>;
  extractEntityInstance: AsyncExtractorRunner<
    QueryForExtractorOrCombinerReturningObject,
    DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceList: AsyncExtractorRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    DomainElementInstanceArrayOrFailed
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractor: AsyncExtractorRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceListWithObjectListExtractor: AsyncExtractorRunner<
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
  runQueryTemplateWithExtractorCombinerTransformer: AsyncQueryTemplateRunner<
    DomainElementObjectOrFailed
  >;
};


export type SyncExtractorOrQueryRunnerMap<StateType> = {
  extractorType: "sync";
  extractWithExtractorOrCombinerReturningObjectOrObjectList: SyncExtractWithExtractorOrCombinerReturningObjectOrObjectList<StateType>;
  runQuery: SyncQueryRunner<StateType, DomainElementObjectOrFailed>;
  extractEntityInstance: SyncExtractorRunner<
    QueryForExtractorOrCombinerReturningObject,
    StateType,
    DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndex: SyncExtractorRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractor: SyncExtractorRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceList: SyncExtractorRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceArrayOrFailed
  >;
  extractEntityInstanceListWithObjectListExtractor: SyncExtractorRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceArrayOrFailed
  >;
  // ################################################################################################
  // TODO: has direct call in ReportView, ReportSectionListDisplay, JzodObjectEditor
  runQueryTemplateWithExtractorCombinerTransformer: SyncQueryTemplateRunner<
    StateType,
    DomainElementObjectOrFailed
  >;
};


// ################################################################################################
// ################################################################################################
// ################################################################################################
// JZOD SCHEMAS  ##################################################################################
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

