import {
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedExtractorTemplateReturningObjectOrObjectList,
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
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  RunBoxedExtractorAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  DomainElementInstanceUuidIndex,
  EntityInstancesUuidIndex,
  DomainElementSuccess,
  EntityInstance
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { Action2ReturnType, Domain2QueryReturnType } from "./DomainElement.js";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction): Promise<Action2ReturnType>;
}

// ################################################################################################
export interface ExtractorOrQueryPersistenceStoreRunner {
  handleBoxedExtractorAction(query: RunBoxedExtractorAction): Promise<Action2ReturnType>;
  handleBoxedQueryAction(query: RunBoxedQueryAction): Promise<Action2ReturnType>;
}

// ################################################################################################
// ################################################################################################
// BOXED EXTRACTOR TEMPLATES ############################################################################

export interface SyncBoxedExtractorTemplateRunnerParams<
  ExtractorTemplate extends BoxedExtractorTemplateReturningObjectOrObjectList,
  StateType
> {
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<StateType>;
  extractorOrCombinerTemplate: ExtractorTemplate;
}

export type SyncBoxedExtractorTemplateRunner<
  QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList,
  StateType,
  ResultType
> = (state: StateType, extractorAndParams: SyncBoxedExtractorTemplateRunnerParams<QueryType, StateType>) => ResultType;

// ################################################################################################
export interface AsyncBoxedExtractorTemplateRunnerParams<ExtractorTemplateDomainModelType extends BoxedExtractorTemplateReturningObjectOrObjectList> {
  extractorRunnerMap?: AsyncBoxedExtractorOrQueryRunnerMap
  extractorOrCombinerTemplate: ExtractorTemplateDomainModelType
}


// ################################################################################################
export type AsyncBoxedExtractorTemplateRunner<QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList, ResultType> = (
  extractorAndParams: AsyncBoxedExtractorTemplateRunnerParams<QueryType>
) => Promise<ResultType>;


// ################################################################################################
export type BoxedExtractorTemplateRunner<QueryType extends BoxedExtractorTemplateReturningObjectOrObjectList, StateType, ResultType> =
  | SyncBoxedExtractorTemplateRunner<QueryType, StateType, ResultType>
  | AsyncBoxedExtractorTemplateRunner<QueryType, ResultType>;

// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateActionForServerONLY(query: RunBoxedQueryTemplateAction): Promise<Action2ReturnType>;
  handleBoxedExtractorTemplateActionForServerONLY(query: RunBoxedExtractorTemplateAction): Promise<Action2ReturnType>;
  handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(query: RunBoxedQueryTemplateOrBoxedExtractorTemplateAction): Promise<Action2ReturnType>;
}


// ################################################################################################
// ################################################################################################
// BOXED EXTRACTORS #####################################################################################
export interface SyncBoxedExtractorRunnerParams<ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, StateType> {
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<StateType>
  extractor: ExtractorType
}

export interface AsyncBoxedExtractorRunnerParams<ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList> {
  extractorRunnerMap?: AsyncBoxedExtractorOrQueryRunnerMap
  extractor: ExtractorType
}

export type SyncBoxedExtractorRunner<QueryType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, StateType, ResultType> = (
  domainState: StateType,
  extractorAndParams: SyncBoxedExtractorRunnerParams<QueryType, StateType>
) => ResultType;

export type AsyncBoxedExtractorRunner<ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, ResultType> = (
  extractorAndParams: AsyncBoxedExtractorRunnerParams<ExtractorType>
) => Promise<ResultType>;

export type AsyncExtractWithBoxedExtractorOrCombinerReturningObjectOrObjectList = AsyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  Domain2QueryReturnType<DomainElementSuccess>
>;

// ################################################################################################
export type SyncExtractWithBoxedExtractorOrCombinerReturningObjectOrObjectList<StateType> = SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  StateType,
  Domain2QueryReturnType<DomainElementSuccess>
>;



// ################################################################################################
// ################################################################################################
// QUERY ##########################################################################################
export interface SyncQueryRunnerParams<StateType> {
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<StateType>
  extractor: BoxedQueryWithExtractorCombinerTransformer
}

// ################################################################################################
export type SyncQueryRunner<
  StateType,
  ResultType
> = (state: StateType, extractorAndParams: SyncQueryRunnerParams<StateType>) => ResultType;

// ################################################################################################
export interface AsyncQueryRunnerParams {
  extractorRunnerMap?: AsyncBoxedExtractorOrQueryRunnerMap
  extractor: BoxedQueryWithExtractorCombinerTransformer
}

// ################################################################################################
export type AsyncQueryRunner<ResultType> = (
  extractorAndParams: AsyncQueryRunnerParams
) => Promise<ResultType>;


// ################################################################################################
// ################################################################################################
// QUERY TEMPLATES ################################################################################
export interface SyncQueryTemplateRunnerParams<StateType> {
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<StateType>;
  extractorOrCombinerTemplate: BoxedQueryTemplateWithExtractorCombinerTransformer;
}

// ################################################################################################
export type SyncQueryTemplateRunner<
  StateType,
  ResultType
> = (state: StateType, extractorAndParams: SyncQueryTemplateRunnerParams<StateType>) => ResultType;

// ################################################################################################
export interface AsyncQueryTemplateRunnerParams {
  extractorRunnerMap?: AsyncBoxedExtractorOrQueryRunnerMap
  extractorOrCombinerTemplate: BoxedQueryTemplateWithExtractorCombinerTransformer
}

// ################################################################################################
export type AsyncQueryTemplateRunner<ResultType> = (
  extractorAndParams: AsyncQueryTemplateRunnerParams
) => Promise<ResultType>;


// ################################################################################################
// ################################################################################################
// QUERY OR EXTRACTOR  ############################################################################
export type ExtractorOrQueryRunnerMap<StateType> = AsyncBoxedExtractorOrQueryRunnerMap | SyncBoxedExtractorOrQueryRunnerMap<StateType>;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// MAPS  ##########################################################################################
export type AsyncBoxedExtractorOrQueryRunnerMap = {
  extractorType: "async";
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: AsyncExtractWithBoxedExtractorOrCombinerReturningObjectOrObjectList;
  runQuery: AsyncQueryRunner<Domain2QueryReturnType<any>>;
  extractEntityInstance: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObject,
    Domain2QueryReturnType<EntityInstance>
  >;
  extractEntityInstanceUuidIndex: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstancesUuidIndex>
  >;
  extractEntityInstanceList: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstance[]>
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractor: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstancesUuidIndex>
  >;
  extractEntityInstanceListWithObjectListExtractor: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstance[]>
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
      | BoxedQueryWithExtractorCombinerTransformer
    >
  ): Promise<Domain2QueryReturnType<DomainElementSuccess>>;
  // ################################################################################################
  runQueryTemplateWithExtractorCombinerTransformer: AsyncQueryTemplateRunner<
    Domain2QueryReturnType<any>
  >;
};


export type SyncBoxedExtractorOrQueryRunnerMap<StateType> = {
  extractorType: "sync";
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: SyncExtractWithBoxedExtractorOrCombinerReturningObjectOrObjectList<StateType>;
  runQuery: SyncQueryRunner<StateType, Domain2QueryReturnType<any>>;
  extractEntityInstance: SyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObject,
    StateType,
    Domain2QueryReturnType<EntityInstance>
  >;
  extractEntityInstanceUuidIndex: SyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    StateType,
    Domain2QueryReturnType<EntityInstancesUuidIndex>
  >;
  extractEntityInstanceUuidIndexWithObjectListExtractor: SyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    StateType,
    Domain2QueryReturnType<EntityInstancesUuidIndex>
  >;
  extractEntityInstanceList: SyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    StateType,
    Domain2QueryReturnType<EntityInstance[]>
  >;
  extractEntityInstanceListWithObjectListExtractor: SyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    StateType,
    Domain2QueryReturnType<EntityInstance[]>
  >;
  // ################################################################################################
  // TODO: has direct call in ReportView, ReportSectionListDisplay, JzodObjectEditor
  runQueryTemplateWithExtractorCombinerTransformer: SyncQueryTemplateRunner<
    StateType,
    Domain2QueryReturnType<any>
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

