import { createSelector } from "@reduxjs/toolkit";
import {
  ApplicationSection,
  ApplicationVersion,
  ReduxDeploymentsState,
  EntityDefinition,
  EntityInstancesUuidIndex,
  JzodSchemaDefinition,
  LoggerInterface,
  Menu,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  MiroirQueryTemplate,
  Report,
  StoreBasedConfiguration,
  Uuid,
  adminConfigurationDeploymentMiroir,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityReport,
  entitySelfApplicationVersion,
  entityStoreBasedConfiguration
} from "miroir-core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState,
  selectMiroirSelectorQueryParams,
} from "./LocalCacheSliceSelectors.js";
import { ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCacheSliceModelSelector")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
function selectEntityInstancesFromReduxDeploymentsState(
  reduxState: ReduxDeploymentsState,
  deploymentUuid: Uuid | undefined,
  applicationSection:ApplicationSection | undefined,
  entityUuid: Uuid | undefined
) {
  const result = selectEntityInstanceUuidIndexFromLocalCacheQueryAndReduxDeploymentsState(reduxState, {
    queryType: "localCacheEntityInstancesExtractor",
    definition: {
      deploymentUuid,
      applicationSection,
      entityUuid,
    },
  });
  return result;
}

// ################################################################################################
// const selectEntities = (reduxState: ReduxStateWithUndoRedo, params:  ) => {
const selectEntitiesFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: ReduxDeploymentsState, params: MiroirQueryTemplate) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      params.queryType == "localCacheEntityInstancesExtractor" ? params.definition.deploymentUuid??"undefined" : "undefined",
      "model",
      entityEntity.uuid
    )
  }
);

// ################################################################################################
const selectEntityDefinitionsFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: ReduxDeploymentsState, params: MiroirQueryTemplate) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      params.queryType == "localCacheEntityInstancesExtractor" ? params.definition.deploymentUuid??"undefined" : "undefined",
      "model",
      entityEntityDefinition.uuid
    )
  }
);

// ################################################################################################
const selectJzodSchemasFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: ReduxDeploymentsState, params: MiroirQueryTemplate) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      params.queryType == "localCacheEntityInstancesExtractor" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "localCacheEntityInstancesExtractor"
            ? params.definition.deploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entityJzodSchema.uuid
    )
    // return selectEntityInstancesFromReduxDeploymentsState(reduxState,params, entityJzodSchema.uuid)
  }
);

// ################################################################################################
const selectMenusFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: ReduxDeploymentsState, params: MiroirQueryTemplate) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      params.queryType == "localCacheEntityInstancesExtractor" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "localCacheEntityInstancesExtractor"
            ? params.definition.deploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entityMenu.uuid
    )
  }
);

// ################################################################################################
const selectReportsFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: ReduxDeploymentsState, params: MiroirQueryTemplate) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      params.queryType == "localCacheEntityInstancesExtractor" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "localCacheEntityInstancesExtractor"
            ? params.definition.deploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entityReport.uuid
    )
  }
);

// ################################################################################################
const selectConfigurationsFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: ReduxDeploymentsState, params: MiroirQueryTemplate) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      params.queryType == "localCacheEntityInstancesExtractor" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "localCacheEntityInstancesExtractor"
            ? params.definition.deploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entityStoreBasedConfiguration.uuid
    )
    // return selectEntityInstancesFromReduxDeploymentsState(reduxState,params, entityStoreBasedConfiguration.uuid)
  }
);

// ################################################################################################
const selectApplicationVersionsFromReduxState = createSelector(
  [selectCurrentReduxDeploymentsStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: ReduxDeploymentsState, params: MiroirQueryTemplate) => {
    return selectEntityInstancesFromReduxDeploymentsState(
      reduxState,
      params.queryType == "localCacheEntityInstancesExtractor" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "localCacheEntityInstancesExtractor"
            ? params.definition.deploymentUuid == adminConfigurationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entitySelfApplicationVersion.uuid
    )
  }
);

//#########################################################################################
export const selectModelForDeploymentFromReduxState: () => (
  state: ReduxStateWithUndoRedo,
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
      // params: MiroirQueryTemplate
    ) => {
      const result = {
        applicationVersions: (applicationVersions
          ? Object.values(applicationVersions)
          : []) as ApplicationVersion[],
        applicationVersionCrossEntityDefinition: [],
        configuration: (configurations ? Object.values(configurations) : []) as StoreBasedConfiguration[],
        entities: (entities ? Object.values(entities) : []) as MetaEntity[],
        entityDefinitions: (entityDefinitions ? Object.values(entityDefinitions) : []) as EntityDefinition[],
        jzodSchemas: (jzodSchemas ? Object.values(jzodSchemas) : []) as JzodSchemaDefinition[],
        menus: (menus ? Object.values(menus) : []) as Menu[],
        reports: (reports ? Object.values(reports) : []) as Report[],
      } as MetaModel;
      // log.info("selectModelForDeploymentFromReduxState",result);

      return result;
    }
  );
