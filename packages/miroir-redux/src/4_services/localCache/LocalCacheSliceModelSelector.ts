import { createSelector } from "@reduxjs/toolkit";
import {
  EntityDefinition,
  EntityInstancesUuidIndex,
  JzodSchemaDefinition,
  MetaEntity,
  MiroirApplicationModel,
  MiroirApplicationVersion,
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
} from "miroir-core";
import { ReduxStateWithUndoRedo } from "./localCacheInterface";
import { selectEntityInstanceUuidIndexFromLocalCache, selectSelectorParams } from "./LocalCacheSliceSelectors";

// ################################################################################################
const selectEntities = (reduxState: ReduxStateWithUndoRedo,  params:MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
    type: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid:undefined,
      applicationSection: "model",
      entityUuid: entityEntity.uuid,
    }
  });
  // console.log('selectEntities',result);
  
  return result;
}
// ################################################################################################
const selectEntityDefinitions = (reduxState: ReduxStateWithUndoRedo,  params:MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
    type: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid:undefined,
      applicationSection: "model",
      entityUuid: entityEntityDefinition.uuid,
    }
  });
  // console.log('selectEntityDselectEntityDefinitionsefinitions',result);
  
  return result;
}
// ################################################################################################
const selectJzodSchemas = (reduxState: ReduxStateWithUndoRedo,  params:MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
    type: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid:undefined,
      applicationSection: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid == applicationDeploymentMiroir.uuid ? "data" : "model":undefined,
      entityUuid: entityJzodSchema.uuid,
    }
  });
  // console.log('selectJzodSchemas',result);
  
  return result;
}
// ################################################################################################
const selectReports = (reduxState: ReduxStateWithUndoRedo,  params:MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
    type: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid:undefined,
      applicationSection: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid == applicationDeploymentMiroir.uuid ? "data" : "model":undefined,
      entityUuid: entityReport.uuid,
    }
  });
  // console.log('selectReports',result);
  
  return result;
}
// ################################################################################################
const selectConfigurations = (reduxState: ReduxStateWithUndoRedo,  params:MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
    type: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid:undefined,
      applicationSection: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid == applicationDeploymentMiroir.uuid ? "data" : "model":undefined,
      entityUuid: entityStoreBasedConfiguration.uuid,
    }
  });
  // console.log('selectConfigurations',result);
  
  return result;
}

// ################################################################################################
const selectApplicationVersions = (reduxState: ReduxStateWithUndoRedo, params: MiroirSelectorQueryParams) => {
  const result = selectEntityInstanceUuidIndexFromLocalCache(reduxState, {
    type: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid:undefined,
      applicationSection: params.type == "LocalCacheEntityInstancesSelectorParams"?params.definition.deploymentUuid == applicationDeploymentMiroir.uuid ? "data" : "model":undefined,
      entityUuid: entityApplicationVersion.uuid,
    }
  });
  // console.log('selectApplicationVersions',result);

  return result;
};


//#########################################################################################
export const selectModelForDeployment = ()=>createSelector(
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
      applicationVersions:(applicationVersions?Object.values(applicationVersions):[]) as MiroirApplicationVersion[],
      applicationVersionCrossEntityDefinition: [],
      configuration:(configurations?Object.values(configurations):[]) as StoreBasedConfiguration[],
      entities:(entities?Object.values(entities):[]) as MetaEntity[],
      entityDefinitions:(entityDefinitions?Object.values(entityDefinitions):[]) as EntityDefinition[],
      jzodSchemas:(jzodSchemas?Object.values(jzodSchemas):[]) as JzodSchemaDefinition[],
      reports:(reports?Object.values(reports):[]) as Report[],
    } as MiroirApplicationModel;
    // console.log("selectModelForDeployment",params,result);
    
    return result;
  }
);

