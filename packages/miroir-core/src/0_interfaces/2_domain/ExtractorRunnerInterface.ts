import type { ApplicationDeploymentMap } from "../../1_core/Deployment";
import {
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  DomainElementSuccess,
  DomainModelQueryTemplateJzodSchemaParams,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition,
  QueryByQuery2GetParamJzodSchema,
  QueryByQueryGetParamJzodSchema,
  QueryByQueryTemplateGetParamJzodSchema,
  QueryByTemplateGetParamJzodSchema,
  QueryJzodSchemaParams,
  RunBoxedQueryAction,
  RunBoxedQueryTemplateAction,
  TransformerForBuildPlusRuntime
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../1_core/Transformer";
import { Action2ReturnType, Domain2QueryReturnType } from "./DomainElement";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;


// ################################################################################################
export interface ExtractorOrQueryPersistenceStoreRunner {
  handleBoxedQueryAction(
    query: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Action2ReturnType>;
}

// ################################################################################################
// ################################################################################################
// BOXED EXTRACTOR TEMPLATES ############################################################################




// ################################################################################################
export interface ExtractorTemplatePersistenceStoreRunner {
  handleQueryTemplateActionForServerONLY(
    query: RunBoxedQueryTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Action2ReturnType>;
}


// ################################################################################################
// ################################################################################################
// BOXED EXTRACTORS #####################################################################################
export interface SyncBoxedExtractorRunnerParams<ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, StateType> {
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<StateType>
  extractor: ExtractorType,
  // applicationDeploymentMap: ApplicationDeploymentMap,
}

export interface AsyncBoxedExtractorRunnerParams<ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList> {
  extractorRunnerMap?: AsyncBoxedExtractorOrQueryRunnerMap
  extractor: ExtractorType
}

export type SyncBoxedExtractorRunner<QueryType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, StateType, ResultType> = (
  domainState: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  extractorAndParams: SyncBoxedExtractorRunnerParams<QueryType, StateType>,
  modelEnvironment: MiroirModelEnvironment,
) => ResultType;

export type AsyncBoxedExtractorRunner<ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList, ResultType> = (
  extractorAndParams: AsyncBoxedExtractorRunnerParams<ExtractorType>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
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
export interface SyncQueryRunnerExtractorAndParams<StateType> {
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<StateType>
  extractor: BoxedQueryWithExtractorCombinerTransformer,
}

// ################################################################################################
export type SyncQueryRunner<StateType, ResultType> = (
  state: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  extractorAndParams: SyncQueryRunnerExtractorAndParams<StateType>,
  modelEnvironment: MiroirModelEnvironment
) => ResultType;

// ################################################################################################
export interface AsyncQueryRunnerParams {
  extractorRunnerMap?: AsyncBoxedExtractorOrQueryRunnerMap
  extractor: BoxedQueryWithExtractorCombinerTransformer,
}

// ################################################################################################
export type AsyncQueryRunner<ResultType> = (
  extractorAndParams: AsyncQueryRunnerParams,
  applicationDeploymentMap: ApplicationDeploymentMap,
  modelEnvironment: MiroirModelEnvironment,
) => Promise<ResultType>;


// ################################################################################################
// ################################################################################################
// QUERY TEMPLATES ################################################################################
export interface SyncQueryTemplateRunnerParams<StateType> {
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<StateType>;
  extractorOrCombinerTemplate: BoxedQueryTemplateWithExtractorCombinerTransformer;
}

// ################################################################################################
export type SyncQueryTemplateRunner<StateType, ResultType> = (
  state: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  extractorAndParams: SyncQueryTemplateRunnerParams<StateType>,
  modelEnvironment: MiroirModelEnvironment,
) => ResultType;

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
export type ExtractorOrQueryRunnerMap<StateType> =
  | AsyncBoxedExtractorOrQueryRunnerMap
  | SyncBoxedExtractorOrQueryRunnerMap<StateType>;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// MAPS  ##########################################################################################
export type AsyncBoxedExtractorOrQueryRunnerMap = {
  extractorOrCombinerType: "async";
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
    query: TransformerForBuildPlusRuntime,
    modelEnvironment: MiroirModelEnvironment,
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
  extractorOrCombinerType: "sync";
  // extractState: (state: StateType, params: any) => StateType;
  extractState: (
    state: StateType,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: any,
    modelEnvironment: MiroirModelEnvironment
  ) => StateType;
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
  // TODO: has direct call in ReportView, ReportSectionListDisplay, JzodElementEditor
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
  // applicationDeploymentMap: ApplicationDeploymentMap,
  query: QueryTemplateType
}

// ################################################################################################
export interface ExtractorRunnerParamsForJzodSchema<QueryType extends QueryJzodSchemaParams, StateType> {
  extractorRunnerMap: QueryRunnerMapForJzodSchema<StateType>
  // applicationDeploymentMap: ApplicationDeploymentMap,
  query: QueryType
}

// ################################################################################################
export type JzodSchemaQueryTemplateSelector<QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams, StateType> = (
  domainState: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType, StateType>,
  modelEnvironment: MiroirModelEnvironment,
) => RecordOfJzodElement | JzodElement | undefined;

// ################################################################################################
export type JzodSchemaQuerySelector<QueryType extends QueryJzodSchemaParams, StateType> = (
  domainState: StateType,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: ExtractorRunnerParamsForJzodSchema<QueryType, StateType>,
  modelEnvironment: MiroirModelEnvironment,
) => RecordOfJzodElement | JzodElement | undefined;

