import { createSelector } from "@reduxjs/toolkit";
import {
  ApplicationSection,
  ApplicationVersion,
  EntityDefinition,
  EntityInstancesUuidIndex,
  LoggerInterface,
  Menu,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  MiroirQueryTemplate,
  MlSchema,
  ReduxDeploymentsState,
  Report,
  Uuid,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplicationVersion,
  entityStoreBasedConfiguration,
  selfApplicationMiroir,
  type ApplicationDeploymentMap,
  type EndpointDefinition,
  type Query,
  type Runner
} from "miroir-core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  selectApplicationDeploymentMap,
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState,
  selectMiroirSelectorQueryParams,
} from "./LocalCacheSliceSelectors.js";
import { ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface.js";
import { select } from "typed-redux-saga";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSliceModelSelector")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
function selectEntityInstancesFromReduxDeploymentsState(
  reduxState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  application: Uuid,
  applicationSection:ApplicationSection | undefined,
  entityUuid: Uuid | undefined
) {
  const result = selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState(
    reduxState,
    applicationDeploymentMap,
    {
      queryType: "localCacheEntityInstancesExtractor",
      definition: {
        application,
        applicationSection,
        entityUuid,
      },
    }
  );
  return result;
}

// ################################################################################################
// const selectEntities = (reduxState: ReduxStateWithUndoRedo, params:  ) => {
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
  ) => {
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
  ) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      // params.queryType == "localCacheEntityInstancesExtractor"
      //   ? params.definition.deploymentUuid ?? "undefined"
      //   : "undefined",
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
  ) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      // params.queryType == "localCacheEntityInstancesExtractor"
      //   ? params.definition.deploymentUuid ?? "undefined"
      //   : "undefined",
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entityJzodSchema.uuid
    );
    // return selectEntityInstancesFromReduxDeploymentsState(reduxState,params, entityJzodSchema.uuid)
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
  ) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      // params.queryType == "localCacheEntityInstancesExtractor"
      //   ? params.definition.deploymentUuid ?? "undefined"
      //   : "undefined",
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
  ) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      // params.queryType == "localCacheEntityInstancesExtractor"
      //   ? params.definition.deploymentUuid ?? "undefined"
      //   : "undefined",
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
  ) => {
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
  ) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      // params.queryType == "localCacheEntityInstancesExtractor"
      //   ? params.definition.deploymentUuid ?? "undefined"
      //   : "undefined",
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
const selectRunnersFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState, selectApplicationDeploymentMap, selectMiroirSelectorQueryParams],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate
  ) => {
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
      entityRunner.uuid
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
  ) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application,
      // params.queryType == "localCacheEntityInstancesExtractor"
      //   ? params.definition.deploymentUuid ?? "undefined"
      //   : "undefined",
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entityStoreBasedConfiguration.uuid
    );
    // return selectEntityInstancesFromReduxDeploymentsState(reduxState,params, entityStoreBasedConfiguration.uuid)
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
  ) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application ?? "undefined"
        : params.application,
      // params.queryType == "localCacheEntityInstancesExtractor"
      //   ? params.definition.deploymentUuid ?? "undefined"
      //   : "undefined",
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
      selectRunnersFromReduxState,
      selectQueriesFromReduxState,
      selectEndpointsFromReduxState,
      // selectMiroirQueryTemplateSelectorParams,
    ],
    (
      applicationVersions: EntityInstancesUuidIndex,
      configurations: EntityInstancesUuidIndex,
      entities: EntityInstancesUuidIndex,
      entityDefinitions: EntityInstancesUuidIndex,
      jzodSchemas: EntityInstancesUuidIndex,
      menus: EntityInstancesUuidIndex,
      reports: EntityInstancesUuidIndex,
      runners: EntityInstancesUuidIndex,
      queries: EntityInstancesUuidIndex,
      endpoints: EntityInstancesUuidIndex,
      // params: MiroirQueryTemplate
    ) => {
      const applicationVersion = applicationVersions && Object.values(applicationVersions).length > 0
        ? (Object.values(applicationVersions)[0] as any)
        : null;
      const result: MetaModel = {
        applicationUuid: applicationVersion ? applicationVersion.application : "",
        applicationName: applicationVersion ? applicationVersion.application : "",
        applicationVersions: (applicationVersions
          ? Object.values(applicationVersions)
          : []) as ApplicationVersion[],
        applicationVersionCrossEntityDefinition: [],
        // configuration: (configurations ? Object.values(configurations) : []) as StoreBasedConfiguration[],
        entities: (entities ? Object.values(entities) : []) as MetaEntity[],
        entityDefinitions: (entityDefinitions ? Object.values(entityDefinitions) : []) as EntityDefinition[],
        endpoints: (endpoints ? Object.values(endpoints) : []) as EndpointDefinition[],
        jzodSchemas: (jzodSchemas ? Object.values(jzodSchemas) : []) as MlSchema[],
        menus: (menus ? Object.values(menus) : []) as Menu[],
        reports: (reports ? Object.values(reports) : []) as Report[],
        runners: (runners ? Object.values(runners) : []) as Runner[],
        storedQueries: (queries ? Object.values(queries) : []) as Query[],
      };
      // } as MetaModel;
      // log.info("selectModelForDeploymentFromReduxState",result);

      return result;
    }
  );