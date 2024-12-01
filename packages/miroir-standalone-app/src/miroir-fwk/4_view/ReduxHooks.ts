import { useMemo } from "react";

import { useSelector } from "react-redux";

import {
  ApplicationSection,
  DeploymentEntityState,
  DomainElement,
  DomainModelQueryTemplateJzodSchemaParams,
  DomainState,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodSchemaQueryTemplateSelector,
  ExtractorTemplateRunnerParamsForJzodSchema,
  LocalCacheExtractor,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  MiroirQueryTemplate,
  SyncExtractorOrQueryTemplateRunner,
  SyncExtractorOrQueryTemplateRunnerParams,
  RecordOfJzodElement,
  Uuid,
  getLoggerName,
  selectEntityUuidFromJzodAttribute,
  JzodPlainAttribute,
  MiroirQuery,
  SyncExtractorOrQueryRunner,
  SyncExtractorOrQueryRunnerParams,
  QueryJzodSchemaParams,
  JzodSchemaQuerySelector,
  ExtractorRunnerParamsForJzodSchema
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  applyDeploymentEntityStateJzodSchemaSelectorTemplate,
  applyDeploymentEntityStateQueryTemplateSelector,
  applyDeploymentEntityStateQueryTemplateSelectorForCleanedResult,
  applyDomainStateJzodSchemaSelector,
  applyDomainStateQueryTemplateSelector,
  applyDomainStateQuerySelectorForCleanedResult,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState,
  applyDeploymentEntityStateQuerySelector,
  applyDeploymentEntityStateJzodSchemaSelector,
  applyDeploymentEntityStateQuerySelectorForCleanedResult
} from "miroir-localcache-redux";

import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReduxHooks");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// export type EntityInstanceUuidIndexSelectorParams = localCacheEntityInstancesExtractor;

// ################################################################################################
// ################################################################################################
// ACCESS TO DeploymentEntityState
// ################################################################################################
// ################################################################################################
export function useDeploymentEntityStateQueryTemplateSelector<
  QueryType extends MiroirQueryTemplate,
  ResultType extends DomainElement
>(
  deploymentEntityStateQuerySelector: SyncExtractorOrQueryTemplateRunner<QueryType, DeploymentEntityState, ResultType>,
  selectorParams: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyDeploymentEntityStateQueryTemplateSelector(deploymentEntityStateQuerySelector);
  }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) => innerSelector(state, selectorParams));
  return result;
}

// ################################################################################################
export function useDeploymentEntityStateQuerySelector<
  QueryType extends MiroirQuery,
  ResultType extends DomainElement
>(
  deploymentEntityStateQuerySelector: SyncExtractorOrQueryRunner<QueryType, DeploymentEntityState, ResultType>,
  selectorParams: SyncExtractorOrQueryRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQuery) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyDeploymentEntityStateQuerySelector(deploymentEntityStateQuerySelector);
  }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) => innerSelector(state, selectorParams));
  return result;
}

// ################################################################################################
export function useDeploymentEntityStateQueryTemplateSelectorForCleanedResult<
  QueryType extends MiroirQueryTemplate
>(
  deploymentEntityStateQueryTemplateSelector: SyncExtractorOrQueryTemplateRunner<QueryType, DeploymentEntityState, DomainElement>,
  selectorParams: SyncExtractorOrQueryTemplateRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => DomainElement }
): any {
  const innerSelector = useMemo(() => {
    return applyDeploymentEntityStateQueryTemplateSelectorForCleanedResult(deploymentEntityStateQueryTemplateSelector);
  }, [deploymentEntityStateQueryTemplateSelector]);
  const result: any = useSelector((state: ReduxStateWithUndoRedo) => innerSelector(state, selectorParams));
  return result;
}

// ################################################################################################
export function useDeploymentEntityStateQuerySelectorForCleanedResult<
  QueryType extends MiroirQuery
>(
  deploymentEntityStateQuerySelector: SyncExtractorOrQueryRunner<QueryType, DeploymentEntityState, DomainElement>,
  selectorParams: SyncExtractorOrQueryRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQuery) => DomainElement }
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
export function useDomainStateQueryTemplateSelector<QueryType extends MiroirQueryTemplate, ResultType >(
  domainStateSelector:SyncExtractorOrQueryTemplateRunner<QueryType, DomainState, ResultType>,
  selectorParams:SyncExtractorOrQueryTemplateRunnerParams<QueryType, DomainState>,
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
export function useDomainStateQueryTemplateSelectorForCleanedResult<QueryType extends MiroirQueryTemplate, ResultType >(
  domainStateSelector:SyncExtractorOrQueryTemplateRunner<QueryType, DomainState, DomainElement>,
  selectorParams:SyncExtractorOrQueryTemplateRunnerParams<QueryType, DomainState>,
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

