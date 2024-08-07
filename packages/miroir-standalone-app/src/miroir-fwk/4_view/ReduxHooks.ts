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
  DomainModelExtractor,
  ExtractorRunner,
  ExtractorRunnerParams,
  RecordOfJzodElement,
  Uuid,
  getLoggerName,
  selectEntityUuidFromJzodAttribute,
  JzodPlainAttribute
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  applyDeploymentEntityStateJzodSchemaSelector,
  applyDeploymentEntityStateQuerySelector,
  applyDeploymentEntityStateQuerySelectorForCleanedResult,
  applyDomainStateJzodSchemaSelector,
  applyDomainStateQuerySelector,
  applyDomainStateQuerySelectorForCleanedResult,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState
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
export function useDeploymentEntityStateQuerySelector<QueryType extends DomainModelExtractor, ResultType extends DomainElement>(
  deploymentEntityStateQuerySelector:ExtractorRunner<QueryType, DeploymentEntityState, ResultType>,
  selectorParams:ExtractorRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:DomainModelExtractor) => ResultType }
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
export function useDeploymentEntityStateQuerySelectorForCleanedResult<QueryType extends DomainModelExtractor>(
  // deploymentEntityStateQuerySelector:ExtractorRunner<QueryType, DeploymentEntityState, DomainElement>,
  deploymentEntityStateQuerySelector:ExtractorRunner<QueryType, DeploymentEntityState, DomainElement>,
  selectorParams:ExtractorRunnerParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:DomainModelExtractor) => DomainElement }
): any {
  const innerSelector = useMemo(
    () => {
      return applyDeploymentEntityStateQuerySelectorForCleanedResult(deploymentEntityStateQuerySelector);
    }, [deploymentEntityStateQuerySelector]);
  const result: any = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}


// ################################################################################################
export function useDomainStateQuerySelector<QueryType extends DomainModelExtractor, ResultType >(
  domainStateSelector:ExtractorRunner<QueryType, DomainState, ResultType>,
  selectorParams:ExtractorRunnerParams<QueryType, DomainState>,
  customQueryInterpreter?: { [k: string]: (query:DomainModelExtractor) => ResultType }
): ResultType {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateQuerySelector(domainStateSelector);
    }, [domainStateSelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDomainStateQuerySelectorForCleanedResult<QueryType extends DomainModelExtractor, ResultType >(
  domainStateSelector:ExtractorRunner<QueryType, DomainState, DomainElement>,
  selectorParams:ExtractorRunnerParams<QueryType, DomainState>,
  customQueryInterpreter?: { [k: string]: (query:DomainModelExtractor) => ResultType }
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

