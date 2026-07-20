import { useEffect, useMemo } from "react";

import {
  ApplicationSection,
  Domain2QueryReturnType,
  DomainElementSuccess,
  DomainState,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodPlainAttribute,
  // LocalCacheExtractor,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  MiroirModelEnvironment,
  // MiroirQuery,
  MiroirQueryTemplate,
  MlSchema,
  ReduxDeploymentsState,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams,
  Uuid,
  defaultMetaModelEnvironment,
  getApplicationSection,
  getReduxDeploymentsStateIndex,
  computeSchemaRevision,
  miroirFundamentalJzodSchema,
  selectEntityUuidFromJzodAttribute,
  type ApplicationDeploymentMap,
  type Deployment,
  type LocalCacheExtractor,
  type Menu,
  type ViewParams
} from "miroir-core";
import { 
  entityEndpointVersion,
  entityMenu,
  selfApplicationMiroir
 } from "miroir-test-app_deployment-miroir";
import {
  ReduxStateWithUndoRedo,
  applyDomainStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  applyReduxDeploymentsStateQuerySelector,
  applyReduxDeploymentsStateQuerySelectorForCleanedResult,
  applyReduxDeploymentsStateQueryTemplateSelector,
  applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState,
  useMiroirContextService,
  useSelector,
} from "miroir-react";

import { adminSelfApplication, entityDeployment } from "miroir-test-app_deployment-admin";
import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";

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
  // customQueryInterpreter?: { [k: string]: (query: MiroirQuery) => ResultType }
  customQueryInterpreter?: { [k: string]: (query: any) => ResultType }
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
  customQueryInterpreter?: { // TODO: NOT USED, REMOVE
    // [k: string]: (query: MiroirQuery) => Domain2QueryReturnType<DomainElementSuccess>;
    [k: string]: (query: any) => Domain2QueryReturnType<DomainElementSuccess>;
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
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// TODO: WHAT'S THE POINT??
export function useDefaultValueParams(
  applicationUuid: Uuid | undefined,
  deploymentUuid: Uuid | undefined,
  viewParams?: ViewParams | undefined,
): Record<string, any> {
  const result = useMemo(
    () =>
      ({
        applicationUuid,
        deploymentUuid,
        viewParams,
      }),
    [applicationUuid, deploymentUuid, viewParams]
  );

  return result;
}

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
    // selectModelForDeploymentFromReduxState()(state, applicationDeploymentMap, foreignKeyParams)
  );
  // log.info(
  //   "ReduxHooks useCurrentModel for application",
  //   application,
  //   "applicationDeploymentMap",
  //   applicationDeploymentMap,
  //   "result",
  //   result,
  // );
  return result;
}


// ################################################################################################
/**
 * Returns the current MiroirModelEnvironment for a given deployment.
 * Schema resolution is owned by ModelEnvironmentSync (or ensureSchemaForDeployment for
 * cross-app edge cases) — this hook only reads `schemasPerDeployment`.
 */
export function useCurrentModelEnvironment(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
): MiroirModelEnvironment {
  const context = useMiroirContextService();
  const deploymentUuid = applicationDeploymentMap[application];
  const miroirDeploymentUuid = applicationDeploymentMap[selfApplicationMiroir.uuid];
  const miroirMetaModel: MetaModel = useCurrentModel(selfApplicationMiroir.uuid, applicationDeploymentMap);
  const currentModel: MetaModel = useCurrentModel(application, applicationDeploymentMap);
  const applicationUuids = useMemo(() => Object.keys(applicationDeploymentMap), [applicationDeploymentMap]);
  const endpointsByUuid: Record<Uuid, any> = useEndpointsOfApplications(
    applicationUuids,
    applicationDeploymentMap
  );

  const metaSchemaRevision = useMemo(
    () =>
      miroirDeploymentUuid && miroirMetaModel
        ? computeSchemaRevision(miroirDeploymentUuid, miroirMetaModel, selfApplicationMiroir.uuid)
        : "",
    [miroirDeploymentUuid, miroirMetaModel],
  );

  const appSchemaRevision = useMemo(
    () =>
      deploymentUuid && currentModel
        ? computeSchemaRevision(deploymentUuid, currentModel, application)
        : "",
    [deploymentUuid, currentModel, application],
  );

  // Safety path for apps not covered by ModelEnvironmentSync (single-flight via ensure).
  useEffect(() => {
    if (!currentModel || !deploymentUuid) {
      return;
    }
    context.ensureSchemaForDeployment({
      deploymentUuid,
      applicationUuid: application,
      currentModel,
      metaSchemaRevision,
      appSchemaRevision,
    });
  }, [
    application,
    appSchemaRevision,
    metaSchemaRevision,
    deploymentUuid,
    currentModel,
    context.ensureSchemaForDeployment,
  ]);

  return useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        context.schemasPerDeployment[deploymentUuid] ?? miroirFundamentalJzodSchema,
      miroirMetaModel: miroirMetaModel,
      endpointsByUuid,
      currentModel: currentModel,
      deploymentUuid,
    };
  }, [
    miroirMetaModel,
    currentModel,
    context.schemasPerDeployment,
    endpointsByUuid,
    deploymentUuid,
  ]);
}

// ################################################################################################
/**
 * Resolves the fundamental jzod schema for a deployment from context cache.
 * Population is owned by ModelEnvironmentSync / ensureSchemaForDeployment.
 */
export function useMiroirFundamentalJzodSchemaForDeployment(
  deploymentUuid?: Uuid,
): MlSchema | undefined {
  const context = useMiroirContextService();
  const resolvedDeploymentUuid = deploymentUuid ?? context.deploymentUuid;
  const application = context.application;
  const applicationDeploymentMap = context.applicationDeploymentMap ?? {};
  const miroirDeploymentUuid = applicationDeploymentMap[selfApplicationMiroir.uuid];
  const miroirMetaModel = useCurrentModel(selfApplicationMiroir.uuid, applicationDeploymentMap);
  const currentModel = useCurrentModel(application, applicationDeploymentMap);

  const metaSchemaRevision = useMemo(
    () =>
      miroirDeploymentUuid && miroirMetaModel
        ? computeSchemaRevision(miroirDeploymentUuid, miroirMetaModel, selfApplicationMiroir.uuid)
        : "",
    [miroirDeploymentUuid, miroirMetaModel],
  );

  const appSchemaRevision = useMemo(
    () =>
      resolvedDeploymentUuid && currentModel && application
        ? computeSchemaRevision(resolvedDeploymentUuid, currentModel, application)
        : "",
    [resolvedDeploymentUuid, currentModel, application],
  );

  useEffect(() => {
    if (!currentModel || !resolvedDeploymentUuid || !application) {
      return;
    }
    context.ensureSchemaForDeployment({
      deploymentUuid: resolvedDeploymentUuid,
      applicationUuid: application,
      currentModel,
      metaSchemaRevision,
      appSchemaRevision,
    });
  }, [
    application,
    appSchemaRevision,
    metaSchemaRevision,
    resolvedDeploymentUuid,
    currentModel,
    context.ensureSchemaForDeployment,
  ]);

  return context.schemasPerDeployment[resolvedDeploymentUuid];
}

// ################################################################################################
export function useEndpointsOfApplications(
  applicationUuids: Uuid[],
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  const state: ReduxDeploymentsState = useSelector(selectCurrentReduxDeploymentsStateFromReduxState)

  return useMemo(() => {
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
  }, [state, applicationUuids, applicationDeploymentMap]);
}

// ################################################################################################
export function useMenusOfApplications(
  applicationUuids: Uuid[],
  applicationDeploymentMap: ApplicationDeploymentMap
) {
  const state: ReduxDeploymentsState = useSelector(selectCurrentReduxDeploymentsStateFromReduxState)

  return useMemo(() => {
    const menus: { application: Uuid; menus: Menu[] }[] =
      applicationUuids.map((applicationUuid) => {
        const deploymentUuid = applicationDeploymentMap[applicationUuid];
        if (!deploymentUuid) {
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
  }, [state, applicationUuids, applicationDeploymentMap]);
}


// ################################################################################################
export function useEntityInstanceUuidIndexFromLocalCache(
  params: LocalCacheExtractor,
  applicationDeploymentMap: ApplicationDeploymentMap
): EntityInstancesUuidIndex | undefined {
  const localCacheExtractor: LocalCacheExtractor = useMemo(() => ({ ...params }), [params]);

  return useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, applicationDeploymentMap, localCacheExtractor)
  );
}

// ################################################################################################
export function useApplicationDeploymentMapFromLocalCache(
  applicationDeploymentMap: ApplicationDeploymentMap
): ApplicationDeploymentMap {

  return useSelector((state: ReduxStateWithUndoRedo) => {
    const localCacheDeployments = useEntityInstanceUuidIndexFromLocalCache(
      {
        queryType: "localCacheEntityInstancesExtractor",
        definition: {
          application: adminSelfApplication.uuid,
          applicationSection: "data",
          entityUuid: entityDeployment.uuid,
        },
      },
      applicationDeploymentMap
      ,
    );
    return localCacheDeployments
      ? (Object.fromEntries(
          Object.entries(localCacheDeployments as Record<string, Deployment>).map(
            (e: [string, Deployment]) => [e[1].selfApplication, e[1].uuid],
          ),
        ) as any)
      : ({} as any);
  });
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
