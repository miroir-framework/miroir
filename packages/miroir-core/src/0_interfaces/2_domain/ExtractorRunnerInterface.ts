import {
  ActionReturnType,
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedExtractorTemplateReturningObjectOrObjectList,
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
  QueryJzodSchemaParams,
  QueryTemplateWithExtractorCombinerTransformer,
  QueryWithExtractorCombinerTransformer,
  RunExtractorAction,
  RunQueryAction,
  RunQueryTemplateOrExtractorTemplateAction
} from "../1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateOrExtractorTemplateActionForServerONLY(query: RunQueryTemplateOrExtractorTemplateAction): Promise<ActionReturnType>;
}

// ################################################################################################
export interface ExtractorOrQueryPersistenceStoreRunner {
  handleExtractorAction(query: RunExtractorAction): Promise<ActionReturnType>;
  handleQueryAction(query: RunQueryAction): Promise<ActionReturnType>;
}

// ################################################################################################
// ################################################################################################
// EXTRACTOR TEMPLATES ############################################################################

export interface SyncExtractorTemplateRunnerParams<
  ExtractorTemplate extends BoxedExtractorTemplateReturningObjectOrObjectList,
  StateType
> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>;
  extractorOrCombinerTemplate: ExtractorTemplate;
}

export type SyncExtractorTemplateRunner<
  QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList,
  StateType,
  ResultType
> = (state: StateType, extractorAndParams: SyncExtractorTemplateRunnerParams<QueryType, StateType>) => ResultType;

// ################################################################################################
export interface AsyncExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends BoxedExtractorTemplateReturningObjectOrObjectList> {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractorOrCombinerTemplate: ExtractorTemplateDomainModelType
}


// ################################################################################################
export type AsyncExtractorTemplateRunner<QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList, ResultType> = (
  extractorAndParams: AsyncExtractorTemplateRunnerParams<QueryType>
) => Promise<ResultType>;


// ################################################################################################
export type ExtractorTemplateRunner<QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList, StateType, ResultType> =
  | SyncExtractorTemplateRunner<QueryType, StateType, ResultType>
  | AsyncExtractorTemplateRunner<QueryType, ResultType>;

// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateOrExtractorTemplateActionForServerONLY(query: RunQueryTemplateOrExtractorTemplateAction): Promise<ActionReturnType>;
}


// ################################################################################################
// ################################################################################################
// EXTRACTORS #####################################################################################
export interface SyncExtractorRunnerParams<ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, StateType> {
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<StateType>
  extractor: ExtractorType
}

export interface AsyncExtractorRunnerParams<ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList> {
  extractorRunnerMap?: AsyncExtractorOrQueryRunnerMap
  extractor: ExtractorType
}

export type SyncExtractorRunner<QueryType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncExtractorRunnerParams<QueryType, StateType>
) => ResultType;

export type AsyncExtractorRunner<ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, ResultType> = (
  extractorAndParams: AsyncExtractorRunnerParams<ExtractorType>
) => Promise<ResultType>;

export type AsyncExtractWithExtractorOrCombinerReturningObjectOrObjectList = AsyncExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  DomainElement
>;

// ################################################################################################
export type SyncExtractWithExtractorOrCombinerReturningObjectOrObjectList<StateType> = SyncExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
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
    BoxedExtractorOrCombinerReturningObject,
    DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceList: AsyncExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    DomainElementInstanceArrayOrFailed
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractor: AsyncExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceListWithObjectListExtractor: AsyncExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
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
      | BoxedExtractorOrCombinerReturningObjectList
      | BoxedExtractorOrCombinerReturningObject
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
    BoxedExtractorOrCombinerReturningObject,
    StateType,
    DomainElementEntityInstanceOrFailed
  >;
  extractEntityInstanceUuidIndex: SyncExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractor: SyncExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceUuidIndexOrFailed
  >;
  extractEntityInstanceList: SyncExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    StateType,
    DomainElementInstanceArrayOrFailed
  >;
  extractEntityInstanceListWithObjectListExtractor: SyncExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
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

