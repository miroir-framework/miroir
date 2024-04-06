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
import { ReduxStateWithUndoRedo } from "./localCacheReduxSliceInterface";
import { selectEntityInstanceUuidIndexFromLocalCache, selectSelectorParams } from "./LocalCacheSliceSelectors";
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
const selectEntitiesOld = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
    queryType: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid:
        params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid : undefined,
      applicationSection: "model",
      entityUuid: entityEntity.uuid,
    },
  });
  // log.info('selectEntities',result);

  return result;
};
// ################################################################################################
const selectEntityDefinitionsOld = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
    queryType: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid:
        params.queryType == "LocalCacheEntityInstancesSelectorParams" ? params.definition.deploymentUuid : undefined,
      applicationSection: "model",
      entityUuid: entityEntityDefinition.uuid,
    },
  });
  // log.info('selectEntityDselectEntityDefinitionsefinitions',result);

  return result;
};
// ################################################################################################
const selectJzodSchemasOld = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
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
  // log.info('selectJzodSchemas',result);

  return result;
};
// ################################################################################################
const selectMenusOld = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
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
  // log.info('selectJzodSchemas',result);

  return result;
};
// ################################################################################################
const selectReportsOld = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
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
  // log.info('selectReports',result);

  return result;
};
// ################################################################################################
const selectConfigurationsOld = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
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
  // log.info('selectConfigurations',result);

  return result;
};

// ################################################################################################
const selectApplicationVersionsOld = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
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
};

//#########################################################################################
export const selectModelForDeploymentOld: () => (
  state: ReduxStateWithUndoRedo,
  params: MiroirSelectorQueryParams
) => MetaModel = () =>
  createSelector(
    [
      selectApplicationVersionsOld,
      selectConfigurationsOld,
      selectEntitiesOld,
      selectEntityDefinitionsOld,
      selectJzodSchemasOld,
      selectMenusOld,
      selectReportsOld,
      selectSelectorParams,
    ],
    (
      applicationVersions: EntityInstancesUuidIndex,
      configurations: EntityInstancesUuidIndex,
      entities: EntityInstancesUuidIndex,
      entityDefinitions: EntityInstancesUuidIndex,
      jzodSchemas: EntityInstancesUuidIndex,
      menus: EntityInstancesUuidIndex,
      reports: EntityInstancesUuidIndex,
      params: MiroirSelectorQueryParams
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
