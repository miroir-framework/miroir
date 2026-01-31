import { createSelector } from "@reduxjs/toolkit";
import {
  ApplicationSection,
  ApplicationVersion,
  ReduxDeploymentsState,
  EntityDefinition,
  EntityInstancesUuidIndex,
  MlSchema,
  LoggerInterface,
  Menu,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  MiroirQueryTemplate,
  Report,
  Uuid,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityReport,
  entitySelfApplicationVersion,
  entityStoreBasedConfiguration,
  entityQueryVersion,
  type Query,
  entityEndpointVersion,
  type EndpointDefinition,
  type ApplicationDeploymentMap,
  selfApplicationMiroir,
  getReduxDeploymentsStateIndex,
} from "miroir-core";
import {
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectMiroirSelectorQueryParams,
} from "./LocalCacheSliceSelectors.js";
import { ZustandStateWithUndoRedo } from "./localCacheZustandInterface.js";

const packageName = "miroir-localcache-zustand";
const cleanLevel = "4_services";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSliceModelSelector")
).then((logger: LoggerInterface) => {log = logger});

// Alias for compatibility
type ReduxStateWithUndoRedo = ZustandStateWithUndoRedo;

const emptyIndex: EntityInstancesUuidIndex = {};

// ################################################################################################
const selectApplicationDeploymentMap = (
  state: ZustandStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  queryTemplate: MiroirQueryTemplate
): ApplicationDeploymentMap => {
  return applicationDeploymentMap;
};

// ################################################################################################
function selectEntityInstancesFromReduxDeploymentsState(
  reduxState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  application: Uuid,
  applicationSection: ApplicationSection | undefined,
  entityUuid: Uuid | undefined
): EntityInstancesUuidIndex | undefined {
  if (!entityUuid) {
    return undefined;
  }
  const deploymentUuid = applicationDeploymentMap[application];
  if (!deploymentUuid) {
    return undefined;
  }
  const localEntityIndex = getReduxDeploymentsStateIndex(
    deploymentUuid,
    applicationSection ?? "data",
    entityUuid
  );
  const entityState = reduxState[localEntityIndex];
  return entityState?.entities ?? emptyIndex;
}

// ################################################################################################
const selectEntitiesFromReduxState = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ): EntityInstancesUuidIndex | undefined => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      "model",
      entityEntity.uuid
    );
  }
);

// ################################################################################################
const selectEntityDefinitionsFromReduxState = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ): EntityInstancesUuidIndex | undefined => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      "model",
      entityEntityDefinition.uuid
    );
  }
);

// ################################################################################################
const selectJzodSchemasFromReduxState = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ): EntityInstancesUuidIndex | undefined => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entityJzodSchema.uuid
    );
  }
);

// ################################################################################################
const selectEndpointsFromReduxState = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ): EntityInstancesUuidIndex | undefined => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entityEndpointVersion.uuid
    );
  }
);

// ################################################################################################
const selectMenusFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState, selectApplicationDeploymentMap, selectMiroirSelectorQueryParams],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ): EntityInstancesUuidIndex | undefined => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entityMenu.uuid
    );
  }
);

// ################################################################################################
const selectReportsFromReduxState = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ): EntityInstancesUuidIndex | undefined => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entityReport.uuid
    );
  }
);

// ################################################################################################
const selectQueriesFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState, selectApplicationDeploymentMap, selectMiroirSelectorQueryParams],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ): EntityInstancesUuidIndex | undefined => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entityQueryVersion.uuid
    );
  }
);

// ################################################################################################
const selectConfigurationsFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState, selectApplicationDeploymentMap, selectMiroirSelectorQueryParams],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ): EntityInstancesUuidIndex | undefined => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entityStoreBasedConfiguration.uuid
    );
  }
);

// ################################################################################################
const selectApplicationVersionsFromReduxState = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ): EntityInstancesUuidIndex | undefined => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application ?? "undefined"
        : params.application,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entitySelfApplicationVersion.uuid
    );
  }
);

//#########################################################################################
export const selectModelForDeploymentFromReduxState: () => (
  state: ReduxStateWithUndoRedo,
  applicationDeploymentMap: ApplicationDeploymentMap,
  params: MiroirQueryTemplate
) => MetaModel = () =>
  createSelector(
    [
      selectApplicationVersionsFromReduxState,
      selectConfigurationsFromReduxState,
      selectEntitiesFromReduxState,
      selectEntityDefinitionsFromReduxState,
      selectJzodSchemasFromReduxState,
      selectMenusFromReduxState,
      selectReportsFromReduxState,
      selectQueriesFromReduxState,
      selectEndpointsFromReduxState,
    ],
    (
      applicationVersions: EntityInstancesUuidIndex | undefined,
      configurations: EntityInstancesUuidIndex | undefined,
      entities: EntityInstancesUuidIndex | undefined,
      entityDefinitions: EntityInstancesUuidIndex | undefined,
      jzodSchemas: EntityInstancesUuidIndex | undefined,
      menus: EntityInstancesUuidIndex | undefined,
      reports: EntityInstancesUuidIndex | undefined,
      queries: EntityInstancesUuidIndex | undefined,
      endpoints: EntityInstancesUuidIndex | undefined,
    ) => {
      const result: MetaModel = {
        applicationVersions: (applicationVersions
          ? Object.values(applicationVersions)
          : []) as ApplicationVersion[],
        applicationVersionCrossEntityDefinition: [],
        entities: (entities ? Object.values(entities) : []) as MetaEntity[],
        entityDefinitions: (entityDefinitions ? Object.values(entityDefinitions) : []) as EntityDefinition[],
        endpoints: (endpoints ? Object.values(endpoints) : []) as EndpointDefinition[],
        jzodSchemas: (jzodSchemas ? Object.values(jzodSchemas) : []) as MlSchema[],
        menus: (menus ? Object.values(menus) : []) as Menu[],
        reports: (reports ? Object.values(reports) : []) as Report[],
        storedQueries: (queries ? Object.values(queries) : []) as Query[],
      };
      return result;
    }
  );
