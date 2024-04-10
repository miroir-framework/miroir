import { createSelector } from "@reduxjs/toolkit";
import {
  ApplicationSection,
  ApplicationVersion,
  DeploymentEntityState,
  EntityDefinition,
  EntityInstancesUuidIndex,
  JzodSchemaDefinition,
  LoggerInterface,
  Menu,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  Report,
  StoreBasedConfiguration,
  Uuid,
  applicationDeploymentMiroir,
  entityApplicationVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityReport,
  entityStoreBasedConfiguration,
  getLoggerName,
} from "miroir-core";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import {
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
  selectCurrentDeploymentEntityStateFromReduxState,
  selectMiroirSelectorQueryParams,
} from "./LocalCacheSliceSelectors";
import { ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface";

const loggerName: string = getLoggerName(packageName, cleanLevel,"LocalCacheSliceModelSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
function selectEntityInstancesFromDeploymentEntityState(
  reduxState: DeploymentEntityState,
  deploymentUuid: Uuid | undefined,
  applicationSection:ApplicationSection | undefined,
  entityUuid: Uuid | undefined
) {
  const result = selectEntityInstanceUuidIndexFromDeploymentEntityState(reduxState, {
    queryType: "LocalCacheEntityInstancesSelectorParams",
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
  [selectCurrentDeploymentEntityStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: DeploymentEntityState, params: MiroirSelectorQueryParams) => {
    return selectEntityInstancesFromDeploymentEntityState(
      reduxState,
      params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid??"undefined" : "undefined",
      "model",
      entityEntity.uuid
    )
  }
);

// ################################################################################################
const selectEntityDefinitionsFromReduxState = createSelector(
  [selectCurrentDeploymentEntityStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: DeploymentEntityState, params: MiroirSelectorQueryParams) => {
    return selectEntityInstancesFromDeploymentEntityState(
      reduxState,
      params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid??"undefined" : "undefined",
      "model",
      entityEntityDefinition.uuid
    )
  }
);

// ################################################################################################
const selectJzodSchemasFromReduxState = createSelector(
  [selectCurrentDeploymentEntityStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: DeploymentEntityState, params: MiroirSelectorQueryParams) => {
    return selectEntityInstancesFromDeploymentEntityState(
      reduxState,
      params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "LocalCacheEntityInstancesSelectorParams"
            ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entityJzodSchema.uuid
    )
    // return selectEntityInstancesFromDeploymentEntityState(reduxState,params, entityJzodSchema.uuid)
  }
);

// ################################################################################################
const selectMenusFromReduxState = createSelector(
  [selectCurrentDeploymentEntityStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: DeploymentEntityState, params: MiroirSelectorQueryParams) => {
    return selectEntityInstancesFromDeploymentEntityState(
      reduxState,
      params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "LocalCacheEntityInstancesSelectorParams"
            ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entityMenu.uuid
    )
  }
);

// ################################################################################################
const selectReportsFromReduxState = createSelector(
  [selectCurrentDeploymentEntityStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: DeploymentEntityState, params: MiroirSelectorQueryParams) => {
    return selectEntityInstancesFromDeploymentEntityState(
      reduxState,
      params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "LocalCacheEntityInstancesSelectorParams"
            ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entityReport.uuid
    )
  }
);

// ################################################################################################
const selectConfigurationsFromReduxState = createSelector(
  [selectCurrentDeploymentEntityStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: DeploymentEntityState, params: MiroirSelectorQueryParams) => {
    return selectEntityInstancesFromDeploymentEntityState(
      reduxState,
      params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "LocalCacheEntityInstancesSelectorParams"
            ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entityStoreBasedConfiguration.uuid
    )
    // return selectEntityInstancesFromDeploymentEntityState(reduxState,params, entityStoreBasedConfiguration.uuid)
  }
);

// ################################################################################################
const selectApplicationVersionsFromReduxState = createSelector(
  [selectCurrentDeploymentEntityStateFromReduxState,selectMiroirSelectorQueryParams],
  (reduxState: DeploymentEntityState, params: MiroirSelectorQueryParams) => {
    return selectEntityInstancesFromDeploymentEntityState(
      reduxState,
      params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid??"undefined" : "undefined",
      params.queryType == "LocalCacheEntityInstancesSelectorParams"
            ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
      entityApplicationVersion.uuid
    )
  }
);

//#########################################################################################
export const selectModelForDeploymentFromReduxState: () => (
  state: ReduxStateWithUndoRedo,
  params: MiroirSelectorQueryParams
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
      // selectSelectorParams,
    ],
    (
      applicationVersions: EntityInstancesUuidIndex,
      configurations: EntityInstancesUuidIndex,
      entities: EntityInstancesUuidIndex,
      entityDefinitions: EntityInstancesUuidIndex,
      jzodSchemas: EntityInstancesUuidIndex,
      menus: EntityInstancesUuidIndex,
      reports: EntityInstancesUuidIndex,
      // params: MiroirSelectorQueryParams
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
      // log.info("selectModelForDeploymentFromReduxState",params,result);

      return result;
    }
  );
