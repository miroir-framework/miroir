import { useMemo } from "react";

import { useSelector } from "react-redux";

import {
  ApplicationSection,
  DeploymentEntityState,
  DomainElement,
  DomainModelQueryJzodSchemaParams,
  DomainState,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodSchemaQuerySelector,
  ExtractorRunnerParamsForJzodSchema,
  LocalCacheExtractor,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ExtractorTemplateForDomainModel,
  SyncExtractorTemplateRunner,
  SyncExtractorTemplateRunnerParams,
  RecordOfJzodElement,
  Uuid,
  getLoggerName,
  selectEntityUuidFromJzodAttribute,
  JzodPlainAttribute,
  ExtractorForDomainModel,
  SyncExtractorRunner,
  SyncExtractorRunnerParams
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  applyDeploymentEntityStateJzodSchemaSelector,
  applyDeploymentEntityStateQueryTemplateSelector,
  applyDeploymentEntityStateQueryTemplateSelectorForCleanedResult,
  applyDomainStateJzodSchemaSelector,
  applyDomainStateQueryTemplateSelector,
  applyDomainStateQuerySelectorForCleanedResult,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState,
  applyDeploymentEntityStateQuerySelector
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
export function useDeploymentEntityStateQueryTemplateSelector<QueryType extends ExtractorTemplateForDomainModel, ResultType extends DomainElement>(
  deploymentEntityStateQuerySelector:SyncExtractorTemplateRunner<QueryType, DeploymentEntityState, ResultType>,
  selectorParams:SyncExtractorTemplateRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:ExtractorTemplateForDomainModel) => ResultType }
): ResultType {
  const innerSelector = useMemo(
    () => {
      return applyDeploymentEntityStateQueryTemplateSelector(deploymentEntityStateQuerySelector);
    }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDeploymentEntityStateQuerySelector<QueryType extends ExtractorForDomainModel, ResultType extends DomainElement>(
  deploymentEntityStateQuerySelector:SyncExtractorRunner<QueryType, DeploymentEntityState, ResultType>,
  selectorParams:SyncExtractorRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:ExtractorForDomainModel) => ResultType }
): ResultType {
  const innerSelector = useMemo(
    () => {
      return applyDeploymentEntityStateQuerySelector(deploymentEntityStateQuerySelector);
    }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDeploymentEntityStateQueryTemplateSelectorForCleanedResult<QueryType extends ExtractorTemplateForDomainModel>(
  // deploymentEntityStateQuerySelector:SyncExtractorTemplateRunner<QueryType, DeploymentEntityState, DomainElement>,
  deploymentEntityStateQuerySelector:SyncExtractorTemplateRunner<QueryType, DeploymentEntityState, DomainElement>,
  selectorParams:SyncExtractorTemplateRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:ExtractorTemplateForDomainModel) => DomainElement }
): any {
  const innerSelector = useMemo(
    () => {
      return applyDeploymentEntityStateQueryTemplateSelectorForCleanedResult(deploymentEntityStateQuerySelector);
    }, [deploymentEntityStateQuerySelector]);
  const result: any = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}


// ################################################################################################
// ################################################################################################
// ACCESS TO DomainState
// ################################################################################################
// ################################################################################################
export function useDomainStateQueryTemplateSelector<QueryType extends ExtractorTemplateForDomainModel, ResultType >(
  domainStateSelector:SyncExtractorTemplateRunner<QueryType, DomainState, ResultType>,
  selectorParams:SyncExtractorTemplateRunnerParams<QueryType, DomainState>,
  customQueryInterpreter?: { [k: string]: (query:ExtractorTemplateForDomainModel) => ResultType }
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
export function useDomainStateQueryTemplateSelectorForCleanedResult<QueryType extends ExtractorTemplateForDomainModel, ResultType >(
  domainStateSelector:SyncExtractorTemplateRunner<QueryType, DomainState, DomainElement>,
  selectorParams:SyncExtractorTemplateRunnerParams<QueryType, DomainState>,
  customQueryInterpreter?: { [k: string]: (query:ExtractorTemplateForDomainModel) => ResultType }
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
export function useDomainStateJzodSchemaSelector<QueryType extends DomainModelQueryJzodSchemaParams>(
  domainStateSelector:JzodSchemaQuerySelector<QueryType, DomainState>,
  selectorParams:ExtractorRunnerParamsForJzodSchema<QueryType, DomainState>,
  customQueryInterpreter?: { [k: string]: (query:DomainModelQueryJzodSchemaParams) => RecordOfJzodElement | JzodElement | undefined }
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
export function useDeploymentEntityStateJzodSchemaSelector<QueryType extends DomainModelQueryJzodSchemaParams>(
  domainStateSelector:JzodSchemaQuerySelector<QueryType, DeploymentEntityState>,
  selectorParams:ExtractorRunnerParamsForJzodSchema<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:DomainModelQueryJzodSchemaParams) => RecordOfJzodElement | JzodElement | undefined }
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

