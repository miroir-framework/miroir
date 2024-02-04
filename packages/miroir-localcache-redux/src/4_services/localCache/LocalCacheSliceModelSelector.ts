import { createSelector } from "@reduxjs/toolkit";
import {
  EntityDefinition,
  EntityInstancesUuidIndex,
  JzodSchemaDefinition,
  LoggerInterface,
  MetaEntity,
  MetaModel,
  MiroirApplicationVersionOLD_DO_NOT_USE,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  Report,
  StoreBasedConfiguration,
  applicationDeploymentMiroir,
  entityApplicationVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
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
const selectEntities = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
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
const selectEntityDefinitions = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
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
const selectJzodSchemas = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
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
const selectReports = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
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
const selectConfigurations = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
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
const selectApplicationVersions = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
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
export const selectModelForDeployment: () => (
  state: ReduxStateWithUndoRedo,
  params: MiroirSelectorQueryParams
) => any = () =>
  createSelector(
    [
      selectApplicationVersions,
      selectConfigurations,
      selectEntities,
      selectEntityDefinitions,
      selectJzodSchemas,
      selectReports,
      selectSelectorParams,
    ],
    (
      applicationVersions: EntityInstancesUuidIndex,
      configurations: EntityInstancesUuidIndex,
      entities: EntityInstancesUuidIndex,
      entityDefinitions: EntityInstancesUuidIndex,
      jzodSchemas: EntityInstancesUuidIndex,
      reports: EntityInstancesUuidIndex,
      params: MiroirSelectorQueryParams
    ) => {
      const result = {
        applicationVersions: (applicationVersions
          ? Object.values(applicationVersions)
          : []) as MiroirApplicationVersionOLD_DO_NOT_USE[],
        applicationVersionCrossEntityDefinition: [],
        configuration: (configurations ? Object.values(configurations) : []) as StoreBasedConfiguration[],
        entities: (entities ? Object.values(entities) : []) as MetaEntity[],
        entityDefinitions: (entityDefinitions ? Object.values(entityDefinitions) : []) as EntityDefinition[],
        jzodSchemas: (jzodSchemas ? Object.values(jzodSchemas) : []) as JzodSchemaDefinition[],
        reports: (reports ? Object.values(reports) : []) as Report[],
      } as MetaModel;
      // log.info("selectModelForDeployment",params,result);

      return result;
    }
  );
