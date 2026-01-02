import { useMemo } from "react";

import { useSelector } from "react-redux";

import {
  ApplicationSection,
  Domain2QueryReturnType,
  DomainElementSuccess,
  DomainModelQueryTemplateJzodSchemaParams,
  DomainState,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorRunnerParamsForJzodSchema,
  ExtractorTemplateRunnerParamsForJzodSchema,
  JzodElement,
  JzodPlainAttribute,
  JzodSchema,
  JzodSchemaQuerySelector,
  JzodSchemaQueryTemplateSelector,
  LocalCacheExtractor,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  MiroirModelEnvironment,
  MiroirQuery,
  MiroirQueryTemplate,
  QueryJzodSchemaParams,
  RecordOfJzodElement,
  ReduxDeploymentsState,
  SyncQueryRunner,
  SyncQueryRunnerParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams,
  Uuid,
  adminConfigurationDeploymentMiroir,
  defaultDeploymentUuids,
  defaultMetaModelEnvironment,
  miroirFundamentalJzodSchema,
  selectEntityUuidFromJzodAttribute,
  type ApplicationDeploymentMap,
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  applyDomainStateJzodSchemaSelector,
  applyDomainStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  applyReduxDeploymentsStateJzodSchemaSelector,
  applyReduxDeploymentsStateJzodSchemaSelectorTemplate,
  applyReduxDeploymentsStateQuerySelector,
  applyReduxDeploymentsStateQuerySelectorForCleanedResult,
  applyReduxDeploymentsStateQueryTemplateSelector,
  applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState,
} from "miroir-localcache-redux";

import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";
import { useMiroirContextService } from "./MiroirContextReactProvider.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReduxHooks"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// export type EntityInstanceUuidIndexSelectorParams = localCacheEntityInstancesExtractor;

// ################################################################################################
// ################################################################################################
// ACCESS TO ReduxDeploymentsState
// ################################################################################################
// ################################################################################################
export function useReduxDeploymentsStateQueryTemplateSelector<
  ResultType extends Domain2QueryReturnType<DomainElementSuccess>
>(
  deploymentEntityStateQuerySelector: SyncQueryTemplateRunner<ReduxDeploymentsState, ResultType>,
  selectorParams: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
  // selectorParams: SyncExtractorOrQueryTemplateRunnerParams<QueryType, ReduxDeploymentsState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyReduxDeploymentsStateQueryTemplateSelector(deploymentEntityStateQuerySelector);
  }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateQuerySelector<
  ResultType extends Domain2QueryReturnType<DomainElementSuccess>
>(
  deploymentEntityStateQuerySelector: SyncQueryRunner<ReduxDeploymentsState, ResultType>,
  selectorParams: SyncQueryRunnerParams<ReduxDeploymentsState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQuery) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyReduxDeploymentsStateQuerySelector(deploymentEntityStateQuerySelector);
  }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateQueryTemplateSelectorForCleanedResult(
  deploymentEntityStateQueryTemplateSelector: SyncQueryTemplateRunner<
    ReduxDeploymentsState,
    Domain2QueryReturnType<DomainElementSuccess>
  >,
  selectorParams: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
  customQueryInterpreter?: {
    [k: string]: (query: MiroirQueryTemplate) => Domain2QueryReturnType<DomainElementSuccess>;
  }
): any {
  const innerSelector = useMemo(() => {
    return applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult(
      deploymentEntityStateQueryTemplateSelector
    );
  }, [deploymentEntityStateQueryTemplateSelector]);
  const result: any = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateQuerySelectorForCleanedResult(
  deploymentEntityStateQuerySelector: SyncQueryRunner<
    ReduxDeploymentsState,
    Domain2QueryReturnType<DomainElementSuccess>
  >,
  selectorParams: SyncQueryRunnerParams<ReduxDeploymentsState>,
  customQueryInterpreter?: {
    [k: string]: (query: MiroirQuery) => Domain2QueryReturnType<DomainElementSuccess>;
  }
): any {
  const innerSelector = useMemo(() => {
    return applyReduxDeploymentsStateQuerySelectorForCleanedResult(
      deploymentEntityStateQuerySelector
    );
  }, [deploymentEntityStateQuerySelector]);
  const result: any = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
// ################################################################################################
// ACCESS TO DomainState
// ################################################################################################
// ################################################################################################
// export function useDomainStateQueryTemplateSelector<QueryType extends MiroirQueryTemplate, ResultType >(
export function useDomainStateQueryTemplateSelector<ResultType>(
  domainStateSelector: SyncQueryTemplateRunner<DomainState, ResultType>,
  selectorParams: SyncQueryTemplateRunnerParams<DomainState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyDomainStateQueryTemplateSelector(domainStateSelector);
  }, [domainStateSelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
// export function useDomainStateQueryTemplateSelectorForCleanedResult<QueryType extends MiroirQueryTemplate, ResultType >(
export function useDomainStateQueryTemplateSelectorForCleanedResult<ResultType>(
  domainStateSelector: SyncQueryTemplateRunner<
    DomainState,
    Domain2QueryReturnType<DomainElementSuccess>
  >,
  selectorParams: SyncQueryTemplateRunnerParams<DomainState>,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyDomainStateQuerySelectorForCleanedResult(domainStateSelector);
  }, [domainStateSelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useDomainStateJzodSchemaSelector<
  QueryType extends DomainModelQueryTemplateJzodSchemaParams
>(
  domainStateSelector: JzodSchemaQueryTemplateSelector<QueryType, DomainState>,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>,
  customQueryInterpreter?: {
    [k: string]: (
      query: DomainModelQueryTemplateJzodSchemaParams
    ) => RecordOfJzodElement | JzodElement | undefined;
  }
): RecordOfJzodElement | JzodElement | undefined {
  const innerSelector = useMemo(() => {
    return applyDomainStateJzodSchemaSelector(domainStateSelector);
  }, [domainStateSelector]);
  const result: RecordOfJzodElement | JzodElement | undefined = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      innerSelector(state, selectorParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateJzodSchemaSelectorForTemplate<
  QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams
>(
  domainStateSelector: JzodSchemaQueryTemplateSelector<QueryTemplateType, ReduxDeploymentsState>,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<
    QueryTemplateType,
    ReduxDeploymentsState
  >,
  customQueryInterpreter?: {
    [k: string]: (
      query: DomainModelQueryTemplateJzodSchemaParams
    ) => RecordOfJzodElement | JzodElement | undefined;
  }
): RecordOfJzodElement | JzodElement | undefined {
  const innerSelector = useMemo(() => {
    return applyReduxDeploymentsStateJzodSchemaSelectorTemplate(domainStateSelector);
  }, [domainStateSelector]);
  const result: RecordOfJzodElement | JzodElement | undefined = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      innerSelector(state, selectorParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateJzodSchemaSelector<QueryType extends QueryJzodSchemaParams>(
  domainStateSelector: JzodSchemaQuerySelector<QueryType, ReduxDeploymentsState>,
  selectorParams: ExtractorRunnerParamsForJzodSchema<QueryType, ReduxDeploymentsState>,
  customQueryInterpreter?: {
    [k: string]: (query: QueryJzodSchemaParams) => RecordOfJzodElement | JzodElement | undefined;
  }
): RecordOfJzodElement | JzodElement | undefined {
  const innerSelector = useMemo(() => {
    return applyReduxDeploymentsStateJzodSchemaSelector(domainStateSelector);
  }, [domainStateSelector]);
  const result: RecordOfJzodElement | JzodElement | undefined = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      innerSelector(state, selectorParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useCurrentModel(deploymentUuid: Uuid | undefined): MetaModel {
  const localSelectModelForDeployment = useMemo(selectModelForDeploymentFromReduxState, []);
  const selectorParams: LocalCacheExtractor = useMemo(
    () =>
      ({
        queryType: "localCacheEntityInstancesExtractor",
        definition: {
          deploymentUuid,
        },
      } as LocalCacheExtractor),
    [deploymentUuid]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, selectorParams)
  );
}


// ################################################################################################
// TODO
export function useCurrentModelEnvironmentNOT_IMPLEMENTED(deploymentUuid: string | undefined): any {
  const localSelectModelForDeployment = useMemo(selectModelForDeploymentFromReduxState, []);
  const selectorParams: LocalCacheExtractor = useMemo(
    () =>
      ({
        queryType: "localCacheEntityInstancesExtractor",
        definition: {
          deploymentUuid,
        },
      } as LocalCacheExtractor),
    [deploymentUuid]
  );
  return useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, selectorParams)
  );
}

// ################################################################################################
/**
 * Returns the current MiroirModelEnvironment for a given deployment
 * @param deploymentUuid - The deployment UUID to get the model environment for
 * @returns MiroirModelEnvironment containing the fundamental schema, meta model, and current model
 */
export function useCurrentModelEnvironment(deploymentUuid: Uuid | undefined): MiroirModelEnvironment {
  const context = useMiroirContextService();
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentModel: MetaModel = useCurrentModel(deploymentUuid);
  const endpointsByUuid: Record<Uuid, any> = useEndpointsOfDeployments(
    defaultDeploymentUuids
  ).reduce((acc, endpoint) => {
    acc[endpoint.uuid] = endpoint;
    return acc;
  }, {} as Record<Uuid, any>);

  return useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
      miroirMetaModel: miroirMetaModel,
      endpointsByUuid,
      currentModel: currentModel,
      deploymentUuid,
    };
  }, [miroirMetaModel, currentModel, context.miroirFundamentalJzodSchema]);
}

// ################################################################################################
export function useEndpointsOfDeployments(deploymentUuids: Uuid[]) {
  const models = deploymentUuids.map((deploymentUuid) => useCurrentModel(deploymentUuid));
  const endpoints = models.flatMap((model) => model.endpoints ?? []); // TODO: deal with applications having many deployments
  return endpoints;
}

// ################################################################################################
export function useEntityInstanceUuidIndexFromLocalCache(
  params: LocalCacheExtractor
): EntityInstancesUuidIndex | undefined {
  const selectorParams: LocalCacheExtractor = useMemo(() => ({ ...params }), [params]);

  return useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, selectorParams)
  );
}

//#########################################################################################
function entityInstancesUuidIndexToEntityInstanceArraySelector(state: EntityInstancesUuidIndex) {
  return Object.values(state);
}

//#########################################################################################
export function useLocalCacheInstancesForJzodAttribute(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  deploymentUuid: string | undefined,
  applicationSection: ApplicationSection | undefined,
  jzodSchema: JzodPlainAttribute | undefined
): EntityInstance[] {
  const entityUuid = selectEntityUuidFromJzodAttribute(jzodSchema);
  const miroirEntities = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(state, {
      queryType: "localCacheEntityInstancesExtractor",
      definition: {
        application,
        applicationDeploymentMap,
        deploymentUuid,
        applicationSection,
        entityUuid,
      },
    })
  );
  log.info(
    "useLocalCacheInstancesForJzodAttribute",
    deploymentUuid,
    applicationSection,
    jzodSchema,
    entityUuid,
    miroirEntities
  );
  // return Object.values(miroirEntities) as EntityInstance[];
  return miroirEntities as EntityInstance[];
}
