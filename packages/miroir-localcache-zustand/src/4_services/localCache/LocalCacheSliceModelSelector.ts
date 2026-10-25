import { createSelector } from "@reduxjs/toolkit";
import {
  ApplicationSection,
  ApplicationVersion,
  EntityVersion,
  EntityInstancesUuidIndex,
  LoggerInterface,
  Menu,
  MetaModel,
  MiroirLoggerFactory,
  MiroirQueryTemplate,
  MlSchema,
  ReduxDeploymentsState,
  Report,
  Uuid,
  getApplicationSection,
  getReduxDeploymentsStateIndex,
  type ApplicationDeploymentMap,
  type EndpointDefinition,
  type Entity,
  type MiroirTestDefinition,
  type Query,
  type Runner,
  type SelfApplication,
  type StoredMiroirTheme,
  type TransformerDefinition,
} from "miroir-core";
import {
  entityEndpointVersion,
  entityEntity,
  entityEntityVersion,
  entityMlSchema,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entityMiroirTest,
  entitySelfApplication,
  entitySelfApplicationVersion,
  entityTheme,
  entityTransformerDefinition,
  selfApplicationMiroir,
} from "miroir-app-miroir";
import {
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectMiroirSelectorQueryParams,
} from "./LocalCacheSliceSelectors.js";
import { ZustandStateWithUndoRedo } from "./localCacheZustandInterface.js";

const packageName = "miroir-localcache-zustand";
const cleanLevel = "4_services";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSliceModelSelector");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});

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

// // ################################################################################################
// export function selectApplicationDeploymentMapFromReduxDeploymentsState(
//   reduxState: ReduxDeploymentsState,
//   applicationDeploymentMap: ApplicationDeploymentMap,
// ): ApplicationDeploymentMap | undefined {
//   const deploymentUuid = applicationDeploymentMap[adminSelfApplication.uuid];
//   if (!deploymentUuid) {
//     return undefined;
//   }
//   const localEntityIndex = getReduxDeploymentsStateIndex(
//     deploymentUuid,
//     "data",
//     entityDeployment.uuid
//   );
//   const entityState = reduxState[localEntityIndex];
//   return entityState?.entities
//     ? (Object.fromEntries(
//         Object.entries(entityState.entities as Record<string, Deployment>).map(
//           (e: [string, Deployment]) => [e[1].selfApplication, e[1].uuid],
//         ),
//       ) as any)
//     : (emptyIndex as any);
// }

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
const selectMlSchemasFromReduxState = createSelector(
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
      entityMlSchema.uuid
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
const selectTestsFromReduxState = createSelector(
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
      entityMiroirTest.uuid
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
const selectRunnersFromReduxState = createSelector(
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
      entityRunner.uuid
    );
  }
);

// ################################################################################################
const selectQueriesFromReduxState = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate,
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
      entityQueryVersion.uuid,
    );
  },
);

// ################################################################################################
const selectThemesFromReduxState = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate,
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
      entityTheme.uuid,
    );
  },
);

// ################################################################################################
// #502: the application's TransformerDefinitions, read like themes (the transformer registry adds
// the composites to the stock ones).
const selectTransformerDefinitionsFromReduxState = createSelector(
  [
    selectCurrentReduxDeploymentsStateFromReduxState,
    selectApplicationDeploymentMap,
    selectMiroirSelectorQueryParams,
  ],
  (
    reduxState: ReduxDeploymentsState,
    applicationDeploymentMap: ApplicationDeploymentMap,
    params: MiroirQueryTemplate,
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
      entityTransformerDefinition.uuid,
    );
  },
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
    const application =
      params.queryType == "localCacheEntityInstancesExtractor"
        ? params.definition.application ?? "undefined"
        : params.application;
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      applicationDeploymentMap,
      application,
      getApplicationSection(application, entitySelfApplicationVersion.uuid),
      entitySelfApplicationVersion.uuid,
    );
  }
);

// ################################################################################################
const selectApplicationsFromReduxState = createSelector(
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
      selectApplicationsFromReduxState,
      selectApplicationVersionsFromReduxState,
      selectEntitiesFromReduxState,
      selectEntityDefinitionsFromReduxState,
      selectMlSchemasFromReduxState,
      selectMenusFromReduxState,
      selectReportsFromReduxState,
      selectRunnersFromReduxState,
      selectQueriesFromReduxState,
      selectEndpointsFromReduxState,
      selectTestsFromReduxState,
      selectThemesFromReduxState,
      selectTransformerDefinitionsFromReduxState,
    ],
    (
      applications: EntityInstancesUuidIndex | undefined,
      applicationVersions: EntityInstancesUuidIndex | undefined,
      entities: EntityInstancesUuidIndex | undefined,
      entityVersions: EntityInstancesUuidIndex | undefined,
      mlSchemas: EntityInstancesUuidIndex | undefined,
      menus: EntityInstancesUuidIndex | undefined,
      reports: EntityInstancesUuidIndex | undefined,
      runners: EntityInstancesUuidIndex | undefined,
      queries: EntityInstancesUuidIndex | undefined,
      endpoints: EntityInstancesUuidIndex | undefined,
      tests: EntityInstancesUuidIndex | undefined,
      themes: EntityInstancesUuidIndex | undefined,
      transformerDefinitions: EntityInstancesUuidIndex | undefined,
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
        transformerDefinitions: (transformerDefinitions
          ? Object.values(transformerDefinitions)
          : []) as TransformerDefinition[],
        entities: (entities ? Object.values(entities) : []) as Entity[],
        entityVersions: (entityVersions ? Object.values(entityVersions) : []) as EntityVersion[],
        endpoints: (endpoints ? Object.values(endpoints) : []) as EndpointDefinition[],
        mlSchemas: (mlSchemas ? Object.values(mlSchemas) : []) as MlSchema[],
        menus: (menus ? Object.values(menus) : []) as Menu[],
        reports: (reports ? Object.values(reports) : []) as Report[],
        runners: (runners ? Object.values(runners) : []) as Runner[],
        storedQueries: (queries ? Object.values(queries) : []) as Query[],
        tests: (tests ? Object.values(tests) : []) as MiroirTestDefinition[],
        themes: (themes ? Object.values(themes) : []) as StoredMiroirTheme[],
        applications: (applications ? Object.values(applications) : []) as SelfApplication[],
      };
      return result;
    }
  );
