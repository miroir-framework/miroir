import { useMemo } from "react";

import { useSelector } from "react-redux";

import {
  ApplicationSection,
  DeploymentEntityState,
  DomainElementSuccess,
  DomainModelQueryTemplateJzodSchemaParams,
  Domain2QueryReturnType,
  DomainState,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorRunnerParamsForJzodSchema,
  ExtractorTemplateRunnerParamsForJzodSchema,
  JzodElement,
  JzodPlainAttribute,
  JzodSchemaQuerySelector,
  JzodSchemaQueryTemplateSelector,
  LocalCacheExtractor,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  MiroirQuery,
  MiroirQueryTemplate,
  QueryJzodSchemaParams,
  RecordOfJzodElement,
  SyncQueryRunner,
  SyncQueryRunnerParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams,
  Uuid,
  selectEntityUuidFromJzodAttribute
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  applyDeploymentEntityStateJzodSchemaSelector,
  applyDeploymentEntityStateJzodSchemaSelectorTemplate,
  applyDeploymentEntityStateQuerySelector,
  applyDeploymentEntityStateQuerySelectorForCleanedResult,
  applyDeploymentEntityStateQueryTemplateSelector,
  applyDeploymentEntityStateQueryTemplateSelectorForCleanedResult,
  applyDomainStateJzodSchemaSelector,
  applyDomainStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState
} from "miroir-localcache-redux";

import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReduxHooks")
).then((logger: LoggerInterface) => {log = logger});


// export type EntityInstanceUuidIndexSelectorParams = localCacheEntityInstancesExtractor;

// ################################################################################################
// ################################################################################################
// ACCESS TO DeploymentEntityState
// ################################################################################################
// ################################################################################################
export function useDeploymentEntityStateQueryTemplateSelector<ResultType extends Domain2QueryReturnType<DomainElementSuccess>
>(
  deploymentEntityStateQuerySelector: SyncQueryTemplateRunner<DeploymentEntityState, ResultType>,
  selectorParams: SyncQueryTemplateRunnerParams<DeploymentEntityState>,
  // selectorParams: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyDeploymentEntityStateQueryTemplateSelector(deploymentEntityStateQuerySelector);
  }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) => innerSelector(state, selectorParams));
  return result;
}

// ################################################################################################
export function useDeploymentEntityStateQuerySelector<ResultType extends Domain2QueryReturnType<DomainElementSuccess>>(
  deploymentEntityStateQuerySelector: SyncQueryRunner<DeploymentEntityState, ResultType>,
  selectorParams: SyncQueryRunnerParams<DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQuery) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyDeploymentEntityStateQuerySelector(deploymentEntityStateQuerySelector);
  }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) => innerSelector(state, selectorParams));
  return result;
}

// ################################################################################################
export function useDeploymentEntityStateQueryTemplateSelectorForCleanedResult(
  deploymentEntityStateQueryTemplateSelector: SyncQueryTemplateRunner<
    DeploymentEntityState,
    Domain2QueryReturnType<DomainElementSuccess>
  >,
  selectorParams: SyncQueryTemplateRunnerParams<DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => Domain2QueryReturnType<DomainElementSuccess> }
): any {
  const innerSelector = useMemo(() => {
    return applyDeploymentEntityStateQueryTemplateSelectorForCleanedResult(deploymentEntityStateQueryTemplateSelector);
  }, [deploymentEntityStateQueryTemplateSelector]);
  const result: any = useSelector((state: ReduxStateWithUndoRedo) => innerSelector(state, selectorParams));
  return result;
}

// ################################################################################################
export function useDeploymentEntityStateQuerySelectorForCleanedResult(
  deploymentEntityStateQuerySelector: SyncQueryRunner<DeploymentEntityState, Domain2QueryReturnType<DomainElementSuccess>>,
  selectorParams: SyncQueryRunnerParams<DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQuery) => Domain2QueryReturnType<DomainElementSuccess> }
): any {
  const innerSelector = useMemo(() => {
    return applyDeploymentEntityStateQuerySelectorForCleanedResult(deploymentEntityStateQuerySelector);
  }, [deploymentEntityStateQuerySelector]);
  const result: any = useSelector((state: ReduxStateWithUndoRedo) => innerSelector(state, selectorParams));
  return result;
}


// ################################################################################################
// ################################################################################################
// ACCESS TO DomainState
// ################################################################################################
// ################################################################################################
// export function useDomainStateQueryTemplateSelector<QueryType extends MiroirQueryTemplate, ResultType >(
export function useDomainStateQueryTemplateSelector< ResultType >(
  domainStateSelector:SyncQueryTemplateRunner<DomainState, ResultType>,
  selectorParams:SyncQueryTemplateRunnerParams<DomainState>,
  customQueryInterpreter?: { [k: string]: (query:MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateQueryTemplateSelector(domainStateSelector);
    }, [domainStateSelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
// export function useDomainStateQueryTemplateSelectorForCleanedResult<QueryType extends MiroirQueryTemplate, ResultType >(
export function useDomainStateQueryTemplateSelectorForCleanedResult< ResultType >(
  domainStateSelector:SyncQueryTemplateRunner<DomainState, Domain2QueryReturnType<DomainElementSuccess>>,
  selectorParams:SyncQueryTemplateRunnerParams<DomainState>,
  customQueryInterpreter?: { [k: string]: (query:MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateQuerySelectorForCleanedResult(domainStateSelector);
    }, [domainStateSelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDomainStateJzodSchemaSelector<QueryType extends DomainModelQueryTemplateJzodSchemaParams>(
  domainStateSelector:JzodSchemaQueryTemplateSelector<QueryType, DomainState>,
  selectorParams:ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>,
  customQueryInterpreter?: { [k: string]: (query:DomainModelQueryTemplateJzodSchemaParams) => RecordOfJzodElement | JzodElement | undefined }
): RecordOfJzodElement | JzodElement | undefined {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateJzodSchemaSelector(domainStateSelector);
    }, [domainStateSelector]);
  const result: RecordOfJzodElement | JzodElement | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDeploymentEntityStateJzodSchemaSelectorForTemplate<QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams>(
  domainStateSelector:JzodSchemaQueryTemplateSelector<QueryTemplateType, DeploymentEntityState>,
  selectorParams:ExtractorTemplateRunnerParamsForJzodSchema<QueryTemplateType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:DomainModelQueryTemplateJzodSchemaParams) => RecordOfJzodElement | JzodElement | undefined }
): RecordOfJzodElement | JzodElement | undefined {
  const innerSelector = useMemo(
    () => {
      return applyDeploymentEntityStateJzodSchemaSelectorTemplate(domainStateSelector);
    }, [domainStateSelector]);
  const result: RecordOfJzodElement | JzodElement | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDeploymentEntityStateJzodSchemaSelector<QueryType extends QueryJzodSchemaParams>(
  domainStateSelector:JzodSchemaQuerySelector<QueryType, DeploymentEntityState>,
  selectorParams:ExtractorRunnerParamsForJzodSchema<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:QueryJzodSchemaParams) => RecordOfJzodElement | JzodElement | undefined }
): RecordOfJzodElement | JzodElement | undefined {
  const innerSelector = useMemo(
    () => {
      return applyDeploymentEntityStateJzodSchemaSelector(domainStateSelector);
    }, [domainStateSelector]);
  const result: RecordOfJzodElement | JzodElement | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useCurrentModel(deploymentUuid: Uuid | undefined): MetaModel {
  const localSelectModelForDeployment = useMemo(selectModelForDeploymentFromReduxState,[]);
  const selectorParams:LocalCacheExtractor = useMemo(
    () => ({
      queryType: "localCacheEntityInstancesExtractor",
      definition: {
        deploymentUuid,
      }
    } as LocalCacheExtractor),
    [deploymentUuid]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, selectorParams)
  )
}


// ################################################################################################
export function useEntityInstanceUuidIndexFromLocalCache(params:LocalCacheExtractor): EntityInstancesUuidIndex | undefined {
  const selectorParams:LocalCacheExtractor = useMemo(
    () => ({...params}),
    [params]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, selectorParams)
  )
}

//#########################################################################################
function entityInstancesUuidIndexToEntityInstanceArraySelector(
  state: EntityInstancesUuidIndex
) {
  return Object.values(state);
}

//#########################################################################################
export function useLocalCacheInstancesForJzodAttribute(
  deploymentUuid: string | undefined,
  applicationSection: ApplicationSection | undefined,
  jzodSchema: JzodPlainAttribute | undefined
): EntityInstance[] {
  const entityUuid = selectEntityUuidFromJzodAttribute(jzodSchema)
  const miroirEntities = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(
      state,
      {
        queryType: "localCacheEntityInstancesExtractor",
        definition: {
          deploymentUuid,
          applicationSection,
          entityUuid,
        }
      }
    )
  );
  log.info('useLocalCacheInstancesForJzodAttribute',deploymentUuid,applicationSection,jzodSchema,entityUuid,miroirEntities);
  // return Object.values(miroirEntities) as EntityInstance[];
  return miroirEntities as EntityInstance[];
}

