import { createSelector } from "@reduxjs/toolkit";
import {
  ApplicationSection,
  ApplicationVersion,
  EntityVersion,
  EntityInstancesUuidIndex,
  LoggerInterface,
  Menu,
  Entity,
  MetaModel,
  MiroirLoggerFactory,
  MiroirQueryTemplate,
  MlSchema,
  ReduxDeploymentsState,
  Report,
  Uuid,
  getApplicationSection,
  type ApplicationDeploymentMap,
  type EndpointDefinition,
  type Query,
  type Runner,
  type StoredMiroirTheme,
  type SelfApplication,
  type MiroirTestDefinition
} from "miroir-core";
import {
  entityEndpointVersion,
  entityEntity,
  entityEntityVersion,
  entityJzodSchema,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplicationVersion,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  selectApplicationDeploymentMap,
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState,
  selectMiroirSelectorQueryParams,
} from "./LocalCacheSliceSelectors.js";
import { ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface.js";
import { entitySelfApplication, entityTheme } from "miroir-test-app_deployment-miroir";
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
    const application =
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application
        : params.application;
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      application,
      // #222 — Miroir EV instances live in data; Library keeps model
      getApplicationSection(application, entityEntityVersion.uuid),
      entityEntityVersion.uuid
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
const selectThemesFromReduxState = createSelector(
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
      entityTheme.uuid
    );
  }
);

// ################################################################################################
const selectTestsFromReduxState = createSelector(
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
      entityTheme.uuid
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
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entitySelfApplicationVersion.uuid
    );
  }
);

// ################################################################################################
const selectApplicationFromReduxState = createSelector(
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
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application == selfApplicationMiroir.uuid
          ? "data"
          : "model"
        : undefined,
      entitySelfApplication.uuid
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
      selectApplicationFromReduxState,
      selectApplicationVersionsFromReduxState,
      selectEntitiesFromReduxState,
      selectEntityDefinitionsFromReduxState,
      selectJzodSchemasFromReduxState,
      selectMenusFromReduxState,
      selectReportsFromReduxState,
      selectRunnersFromReduxState,
      selectQueriesFromReduxState,
      selectEndpointsFromReduxState,
      selectTestsFromReduxState,
      selectThemesFromReduxState,
      // selectMiroirQueryTemplateSelectorParams,
    ],
    (
      applications: EntityInstancesUuidIndex,
      applicationVersions: EntityInstancesUuidIndex,
      entities: EntityInstancesUuidIndex,
      entityVersions: EntityInstancesUuidIndex,
      jzodSchemas: EntityInstancesUuidIndex,
      menus: EntityInstancesUuidIndex,
      reports: EntityInstancesUuidIndex,
      runners: EntityInstancesUuidIndex,
      queries: EntityInstancesUuidIndex,
      endpoints: EntityInstancesUuidIndex,
      tests: EntityInstancesUuidIndex,
      themes: EntityInstancesUuidIndex,
      // params: MiroirQueryTemplate
    ) => {
      const application = applications && Object.values(applications).length > 0
        ? (Object.values(applications)[0] as any)
        : null;
      const result: MetaModel = {
        applicationUuid: application ? application.uuid : "",
        applicationName: application ? application.name : "",
        applicationVersions: (applicationVersions
          ? Object.values(applicationVersions)
          : []) as ApplicationVersion[],
        applicationVersionCrossEntityVersion: [],
        applicationVersionCrossQueryVersion: [],
        queryVersions: [],
        applicationVersionCrossReportVersion: [],
        reportVersions: [],
        applicationVersionCrossMenuVersion: [],
        menuVersions: [],
        applicationVersionCrossEndpointVersion: [],
        endpointVersions: [],
        applicationVersionCrossRunnerVersion: [],
        runnerVersions: [],
        applicationVersionCrossThemeVersion: [],
        themeVersions: [],
        applicationVersionCrossTransformerDefinitionVersion: [],
        transformerDefinitionVersions: [],
        // configuration: (configurations ? Object.values(configurations) : []) as StoreBasedConfiguration[],
        entities: (entities ? Object.values(entities) : []) as Entity[],
        entityVersions: (entityVersions ? Object.values(entityVersions) : []) as EntityVersion[],
        endpoints: (endpoints ? Object.values(endpoints) : []) as EndpointDefinition[],
        jzodSchemas: (jzodSchemas ? Object.values(jzodSchemas) : []) as MlSchema[],
        menus: (menus ? Object.values(menus) : []) as Menu[],
        reports: (reports ? Object.values(reports) : []) as Report[],
        runners: (runners ? Object.values(runners) : []) as Runner[],
        applications: (applications ? Object.values(applications) : []) as SelfApplication[],
        storedQueries: (queries ? Object.values(queries) : []) as Query[],
        tests: (tests ? Object.values(tests) : []) as MiroirTestDefinition[],
        themes: (themes ? Object.values(themes) : []) as StoredMiroirTheme[],
      };
      // } as MetaModel;
      // log.info("selectModelForDeploymentFromReduxState",result);

      return result;
    }
  );