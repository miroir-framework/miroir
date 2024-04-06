import { createSelector } from "@reduxjs/toolkit";
import {
  ApplicationVersion,
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
import { LocalCacheSliceStateEntityZone, ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface";
import { selectEntityInstanceUuidIndexFromLocalCache, selectEntityInstanceUuidIndexFromLocalCacheEntityZone, selectLocalCacheCurrentEntityZone, selectMiroirSelectorQueryParams, selectSelectorParams } from "./LocalCacheSliceSelectors";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"LocalCacheSliceModelSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
// const selectEntities = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
const selectEntities = createSelector(
  [selectLocalCacheCurrentEntityZone,selectMiroirSelectorQueryParams],
  (reduxState: LocalCacheSliceStateEntityZone, params: MiroirSelectorQueryParams) => {
    const result = selectEntityInstanceUuidIndexFromLocalCacheEntityZone(reduxState, {
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid:
          params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid : undefined,
        applicationSection: "model",
        entityUuid: entityEntity.uuid,
      },
    });
    return result;
  }
);

// ################################################################################################
const selectEntityDefinitions = createSelector(
  [selectLocalCacheCurrentEntityZone,selectMiroirSelectorQueryParams],
  (reduxState: LocalCacheSliceStateEntityZone, params: MiroirSelectorQueryParams) => {
    const result = selectEntityInstanceUuidIndexFromLocalCacheEntityZone(reduxState, {
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid:
          params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid : undefined,
        applicationSection: "model",
        entityUuid: entityEntityDefinition.uuid,
      },
    });
    return result;
  }
);

// ################################################################################################
const selectJzodSchemas = createSelector(
  [selectLocalCacheCurrentEntityZone,selectMiroirSelectorQueryParams],
  (reduxState: LocalCacheSliceStateEntityZone, params: MiroirSelectorQueryParams) => {
    const result = selectEntityInstanceUuidIndexFromLocalCacheEntityZone(reduxState, {
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid:
          params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid : undefined,
        applicationSection:
          params.queryType == "LocalCacheEntityInstancesSelectorParams"
            ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
        entityUuid: entityJzodSchema.uuid,
      },
    });
    return result;
  }
);

// ################################################################################################
const selectMenus = createSelector(
  [selectLocalCacheCurrentEntityZone,selectMiroirSelectorQueryParams],
  (reduxState: LocalCacheSliceStateEntityZone, params: MiroirSelectorQueryParams) => {
    const result = selectEntityInstanceUuidIndexFromLocalCacheEntityZone(reduxState, {
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid:
          params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid : undefined,
        applicationSection:
          params.queryType == "LocalCacheEntityInstancesSelectorParams"
            ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
        entityUuid: entityMenu.uuid,
      },
    });
    return result;
  }
);

// ################################################################################################
const selectReports = createSelector(
  [selectLocalCacheCurrentEntityZone,selectMiroirSelectorQueryParams],
  (reduxState: LocalCacheSliceStateEntityZone, params: MiroirSelectorQueryParams) => {
    const result = selectEntityInstanceUuidIndexFromLocalCacheEntityZone(reduxState, {
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid:
          params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid : undefined,
        applicationSection:
          params.queryType == "LocalCacheEntityInstancesSelectorParams"
            ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
        entityUuid: entityReport.uuid,
      },
    });
    return result;
  }
);

// ################################################################################################
const selectConfigurations = createSelector(
  [selectLocalCacheCurrentEntityZone,selectMiroirSelectorQueryParams],
  (reduxState: LocalCacheSliceStateEntityZone, params: MiroirSelectorQueryParams) => {
    const result = selectEntityInstanceUuidIndexFromLocalCacheEntityZone(reduxState, {
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid:
          params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid : undefined,
        applicationSection:
          params.queryType == "LocalCacheEntityInstancesSelectorParams"
            ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
              ? "data"
              : "model"
            : undefined,
        entityUuid: entityStoreBasedConfiguration.uuid,
      },
    });
    return result;
  }
);

// ################################################################################################
const selectApplicationVersions = createSelector(
  [selectLocalCacheCurrentEntityZone,selectMiroirSelectorQueryParams],
  (reduxState: LocalCacheSliceStateEntityZone, params: MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCacheEntityZone(reduxState, {
    queryType: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid:
        params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid : undefined,
      applicationSection:
        params.queryType == "LocalCacheEntityInstancesSelectorParams"
          ? params.definition.deploymentUuid == applicationDeploymentMiroir.uuid
            ? "data"
            : "model"
          : undefined,
      entityUuid: entityApplicationVersion.uuid,
    },
  });
  // log.info('selectApplicationVersions',result);

  return result;
  }
);

//#########################################################################################
export const selectModelForDeployment: () => (
  state: ReduxStateWithUndoRedo,
  params: MiroirSelectorQueryParams
) => MetaModel = () =>
  createSelector(
    [
      selectApplicationVersions,
      selectConfigurations,
      selectEntities,
      selectEntityDefinitions,
      selectJzodSchemas,
      selectMenus,
      selectReports,
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
      // log.info("selectModelForDeployment",params,result);

      return result;
    }
  );
