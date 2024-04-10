import { useMemo } from "react";

import { useSelector } from "react-redux";

// import { JzodAttribute } from "@miroir-framework/jzod-ts";
import {
  ApplicationSection,
  DeploymentEntityState,
  DomainElement,
  DomainModelQueryJzodSchemaParams,
  DomainStateJzodSchemaSelector,
  DomainStateJzodSchemaSelectorParams,
  DomainStateQuerySelectorParams,
  DomainStateSelectorNew,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodAttribute,
  JzodElement,
  LocalCacheEntityInstancesSelectorParams,
  LocalCacheQueryParams,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  QuerySelector,
  QuerySelectorParams,
  RecordOfJzodElement,
  Uuid,
  getLoggerName,
  selectEntityUuidFromJzodAttribute
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  applyDeploymentEntityStateQuerySelector,
  applyDeploymentEntityStateQuerySelectorForCleanedResult,
  applyDomainStateJzodSchemaSelector,
  applyDomainStateQuerySelector,
  applyDomainStateQuerySelectorForCleanedResult,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState
} from "miroir-localcache-redux";

import { packageName } from "../../constants";
import { cleanLevel } from "./constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReduxHooks");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export type EntityInstanceUuidIndexSelectorParams = LocalCacheEntityInstancesSelectorParams;

// ################################################################################################
export function useDeploymentEntityStateQuerySelector<QueryType extends MiroirSelectorQueryParams, ResultType extends DomainElement>(
  deploymentEntityStateQuerySelector:QuerySelector<QueryType, DeploymentEntityState, ResultType>,
  selectorParams:QuerySelectorParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:MiroirSelectorQueryParams) => ResultType }
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
export function useDeploymentEntityStateQuerySelectorForCleanedResult<QueryType extends MiroirSelectorQueryParams>(
  // deploymentEntityStateQuerySelector:QuerySelector<QueryType, DeploymentEntityState, DomainElement>,
  deploymentEntityStateQuerySelector:QuerySelector<QueryType, DeploymentEntityState, DomainElement>,
  selectorParams:QuerySelectorParams<QueryType, DeploymentEntityState>,
  customQueryInterpreter?: { [k: string]: (query:MiroirSelectorQueryParams) => DomainElement }
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
export function useDomainStateQuerySelector<Q extends MiroirSelectorQueryParams, T >(
  domainStateSelector:DomainStateSelectorNew<Q, T>,
  selectorParams:DomainStateQuerySelectorParams<Q>,
  customQueryInterpreter?: { [k: string]: (query:MiroirSelectorQueryParams) => T }
): T {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateQuerySelector(domainStateSelector);
    }, [domainStateSelector]);
  const result: T = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDomainStateQuerySelectorForCleanedResult<Q extends MiroirSelectorQueryParams, T >(
  domainStateSelector:DomainStateSelectorNew<Q, DomainElement>,
  selectorParams:DomainStateQuerySelectorParams<Q>,
  customQueryInterpreter?: { [k: string]: (query:MiroirSelectorQueryParams) => T }
): T {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateQuerySelectorForCleanedResult(domainStateSelector);
    }, [domainStateSelector]);
  const result: T = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDomainStateJzodSchemaSelector<Q extends DomainModelQueryJzodSchemaParams>(
  domainStateSelector:DomainStateJzodSchemaSelector<Q>,
  selectorParams:DomainStateJzodSchemaSelectorParams<Q>,
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
export function useCurrentModel(deploymentUuid: Uuid | undefined): MetaModel {
  const localSelectModelForDeployment = useMemo(selectModelForDeploymentFromReduxState,[]);
  const selectorParams:LocalCacheQueryParams = useMemo(
    () => ({
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid,
      }
    } as LocalCacheQueryParams),
    [deploymentUuid]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, selectorParams)
  )
}


// ################################################################################################
export function useEntityInstanceUuidIndexFromLocalCache(params:LocalCacheQueryParams): EntityInstancesUuidIndex | undefined {
  const selectorParams:LocalCacheQueryParams = useMemo(
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
  jzodSchema: JzodAttribute | undefined
): EntityInstance[] {
  const entityUuid = selectEntityUuidFromJzodAttribute(jzodSchema)
  const miroirEntities = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(
      state,
      {
        queryType: "LocalCacheEntityInstancesSelectorParams",
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

