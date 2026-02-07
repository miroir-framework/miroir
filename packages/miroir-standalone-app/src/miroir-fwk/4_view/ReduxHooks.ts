import { useMemo } from "react";

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
  JzodSchemaQuerySelector,
  JzodSchemaQueryTemplateSelector,
  LocalCacheExtractor,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  MiroirModelEnvironment,
  MiroirQuery,
  MiroirQueryTemplate,
  MlSchema,
  QueryJzodSchemaParams,
  RecordOfJzodElement,
  ReduxDeploymentsState,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams,
  Uuid,
  defaultMetaModelEnvironment,
  entityEndpointVersion,
  entityMenu,
  getApplicationSection,
  getReduxDeploymentsStateIndex,
  miroirFundamentalJzodSchema,
  selectEntityUuidFromJzodAttribute,
  selfApplicationMiroir,
  type ApplicationDeploymentMap,
  type Menu
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
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState,
  useSelector,
} from "../miroir-localcache-imports.js";

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
  foreignKeyParams: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyReduxDeploymentsStateQueryTemplateSelector(deploymentEntityStateQuerySelector);
  }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, applicationDeploymentMap, foreignKeyParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateQuerySelector<
  ResultType extends Domain2QueryReturnType<DomainElementSuccess>
>(
  deploymentEntityStateQuerySelector: SyncQueryRunner<ReduxDeploymentsState, ResultType>,
  foreignKeyParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  customQueryInterpreter?: { [k: string]: (query: MiroirQuery) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyReduxDeploymentsStateQuerySelector(deploymentEntityStateQuerySelector);
  }, [deploymentEntityStateQuerySelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, applicationDeploymentMap, foreignKeyParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateQueryTemplateSelectorForCleanedResult(
  deploymentEntityStateQueryTemplateSelector: SyncQueryTemplateRunner<
    ReduxDeploymentsState,
    Domain2QueryReturnType<DomainElementSuccess>
  >,
  foreignKeyParams: SyncQueryTemplateRunnerParams<ReduxDeploymentsState>,
  applicationDeploymentMap: ApplicationDeploymentMap,
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
    innerSelector(state, applicationDeploymentMap, foreignKeyParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateQuerySelectorForCleanedResult(
  deploymentEntityStateQuerySelector: SyncQueryRunner<
    ReduxDeploymentsState,
    Domain2QueryReturnType<DomainElementSuccess>
  >,
  foreignKeyParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>,
  applicationDeploymentMap: ApplicationDeploymentMap,
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
    innerSelector(state, applicationDeploymentMap, foreignKeyParams, defaultMetaModelEnvironment)
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
  foreignKeyParams: SyncQueryTemplateRunnerParams<DomainState>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyDomainStateQueryTemplateSelector(domainStateSelector);
  }, [domainStateSelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, applicationDeploymentMap, foreignKeyParams, defaultMetaModelEnvironment)
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
  foreignKeyParams: SyncQueryTemplateRunnerParams<DomainState>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  customQueryInterpreter?: { [k: string]: (query: MiroirQueryTemplate) => ResultType }
): ResultType {
  const innerSelector = useMemo(() => {
    return applyDomainStateQuerySelectorForCleanedResult(domainStateSelector);
  }, [domainStateSelector]);
  const result: ResultType = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, applicationDeploymentMap, foreignKeyParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useDomainStateJzodSchemaSelector<
  QueryType extends DomainModelQueryTemplateJzodSchemaParams
>(
  domainStateSelector: JzodSchemaQueryTemplateSelector<QueryType, DomainState>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryType, DomainState>,
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
      innerSelector(state, applicationDeploymentMap, foreignKeyParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateJzodSchemaSelectorForTemplate<
  QueryTemplateType extends DomainModelQueryTemplateJzodSchemaParams
>(
  domainStateSelector: JzodSchemaQueryTemplateSelector<QueryTemplateType, ReduxDeploymentsState>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: ExtractorTemplateRunnerParamsForJzodSchema<
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
      innerSelector(state, applicationDeploymentMap, foreignKeyParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
export function useReduxDeploymentsStateJzodSchemaSelector<QueryType extends QueryJzodSchemaParams>(
  domainStateSelector: JzodSchemaQuerySelector<QueryType, ReduxDeploymentsState>,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: ExtractorRunnerParamsForJzodSchema<QueryType, ReduxDeploymentsState>,
  customQueryInterpreter?: {
    [k: string]: (query: QueryJzodSchemaParams) => RecordOfJzodElement | JzodElement | undefined;
  }
): RecordOfJzodElement | JzodElement | undefined {
  const innerSelector = useMemo(() => {
    return applyReduxDeploymentsStateJzodSchemaSelector(domainStateSelector);
  }, [domainStateSelector]);
  log.info(
    "useReduxDeploymentsStateJzodSchemaSelector called",
    applicationDeploymentMap,
    foreignKeyParams,
    "innerSelector",
    innerSelector
  );
  const result: RecordOfJzodElement | JzodElement | undefined = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      innerSelector(state, applicationDeploymentMap, foreignKeyParams, defaultMetaModelEnvironment)
  );
  return result;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function useCurrentModel(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
): MetaModel {
  const localSelectModelForDeployment = useMemo(selectModelForDeploymentFromReduxState, []);
  const foreignKeyParams: LocalCacheExtractor = useMemo(
    () =>
      ({
        queryType: "localCacheEntityInstancesExtractor",
        definition: {
          application,
          applicationDeploymentMap,
          deploymentUuid: applicationDeploymentMap[application ?? ""],
        },
      }),
    [application, applicationDeploymentMap]
  );

  const result = useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, applicationDeploymentMap, foreignKeyParams)
  );
  // log.info("ReduxHooks useCurrentModel for application",application, "result", result);
  return result;
}


// ################################################################################################
/**
 * Returns the current MiroirModelEnvironment for a given deployment
 * @param deploymentUuid - The deployment UUID to get the model environment for
 * @returns MiroirModelEnvironment containing the fundamental schema, meta model, and current model
 */
export function useCurrentModelEnvironment(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
): MiroirModelEnvironment {
  const context = useMiroirContextService();
  const deploymentUuid = applicationDeploymentMap[application]
  const miroirMetaModel: MetaModel = useCurrentModel(selfApplicationMiroir.uuid, applicationDeploymentMap);
  const currentModel: MetaModel = useCurrentModel(application, applicationDeploymentMap);
  const endpointsByUuid: Record<Uuid, any> = useEndpointsOfApplications(
    Object.keys(applicationDeploymentMap),// defaultDeploymentUuids,
    applicationDeploymentMap
  );

  return useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as MlSchema),
      miroirMetaModel: miroirMetaModel,
      endpointsByUuid,
      currentModel: currentModel,
      deploymentUuid,
    };
  }, [miroirMetaModel, currentModel, context.miroirFundamentalJzodSchema, endpointsByUuid, deploymentUuid]);
}

// ################################################################################################
export function useEndpointsOfApplications(
  applicationUuids: Uuid[],
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  const state: ReduxDeploymentsState = useSelector(selectCurrentReduxDeploymentsStateFromReduxState)
  const endpoints: Record<Uuid, any>[] = applicationUuids.map((applicationUuid) => {
    const deploymentUuid = applicationDeploymentMap[applicationUuid];
    if (!deploymentUuid) {
      return {} as Record<Uuid, any>;
    }
    const localEntityIndex = getReduxDeploymentsStateIndex(
      deploymentUuid,
      getApplicationSection(applicationUuid, entityEndpointVersion.uuid),
      entityEndpointVersion.uuid
    );
    const entityState = state[localEntityIndex];
    return entityState?.entities ?? {} as Record<Uuid, any>;
  }) ?? ([] as Record<Uuid, any>[]);

  let result: Record<Uuid, any> = {}
  endpoints.forEach((model) => {
    result = { ...result, ...model };
  }, {} as Record<Uuid, any>);
  return result;
}

// ################################################################################################
export function useMenusOfApplications(
  applicationUuids: Uuid[],
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  const state: ReduxDeploymentsState = useSelector(selectCurrentReduxDeploymentsStateFromReduxState)
  const menus: { application: Uuid; menus: Menu[] }[] =
    applicationUuids.map((applicationUuid) => {
      const deploymentUuid = applicationDeploymentMap[applicationUuid];
      if (!deploymentUuid) {
        // return {} as Record<Uuid, any>;
        throw new Error(`No deployment found for application ${applicationUuid}`);
      }
      const localEntityIndex = getReduxDeploymentsStateIndex(
        deploymentUuid,
        getApplicationSection(applicationUuid, entityMenu.uuid),
        entityMenu.uuid,
      );
      const entityState = state[localEntityIndex];
      return {application: applicationUuid, menus: Object.values(entityState?.entities ?? {})} as { application: Uuid; menus: Menu[] };
    }) ?? [];
  return menus;
  // let result: Record<Uuid, Menu[]> = {}
  // menus.forEach((menu) => {
  //   if (menu)
  //   result = { ...result, ...menu };
  // }, {} as Record<Uuid, any>);
  // return result;
}


// ################################################################################################
export function useEntityInstanceUuidIndexFromLocalCache(
  params: LocalCacheExtractor,
  applicationDeploymentMap: ApplicationDeploymentMap
): EntityInstancesUuidIndex | undefined {
  const foreignKeyParams: LocalCacheExtractor = useMemo(() => ({ ...params }), [params]);

  return useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, applicationDeploymentMap,foreignKeyParams)
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
  mlSchema: JzodPlainAttribute | undefined
): EntityInstance[] {
  const entityUuid = selectEntityUuidFromJzodAttribute(mlSchema);
  const miroirEntities = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(state, applicationDeploymentMap,{
      queryType: "localCacheEntityInstancesExtractor",
      definition: {
        application,
        // deploymentUuid,
        applicationSection,
        entityUuid,
      },
    })
  );
  log.info(
    "useLocalCacheInstancesForJzodAttribute",
    deploymentUuid,
    applicationSection,
    mlSchema,
    entityUuid,
    miroirEntities
  );
  // return Object.values(miroirEntities) as EntityInstance[];
  return miroirEntities as EntityInstance[];
}
