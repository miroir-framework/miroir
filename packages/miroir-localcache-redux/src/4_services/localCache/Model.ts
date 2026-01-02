//#########################################################################################
/**
 * TODO: simila to 
 * miroir-core Model.ts getReportsAndEntitiesDefinitionsForDeploymentUuid, 
 * miroir-core DomainDataAccess.ts selectCurrentDeploymentModel
 * @param deploymentUuid 
 * @param state 
 * @returns 
 */

import {
  type MetaModel,
  adminConfigurationDeploymentMiroir,
  getReduxDeploymentsStateIndex,
  entitySelfApplicationVersion,
  entityStoreBasedConfiguration,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityReport,
  entityQueryVersion,
  type ApplicationVersion,
  type StoreBasedConfiguration,
  type MetaEntity,
  type EntityDefinition,
  type JzodSchema,
  type Menu,
  type Report,
  type Query,
  type MiroirModelEnvironment,
  miroirFundamentalJzodSchema,
  defaultMiroirMetaModel,
  entityEndpointVersion,
} from "miroir-core";
import type { LocalCacheSliceState } from "./localCacheReduxSliceInterface";

// #########################################################################################
export function currentModel(deploymentUuid: string, state:LocalCacheSliceState): MetaModel {
  // log.info(
  //   "called currentModel(",
  //   deploymentUuid,
  //   ") from state:",
  //   Object.keys(state)
  // );

  if (!deploymentUuid) {
    throw new Error("currentModel(deploymentUuid) parameter can not be undefined.");
  } else {
      const metaModelSection = "model";
      const modelSection = deploymentUuid == adminConfigurationDeploymentMiroir.uuid?"data":"model";
      const applicationVersions = state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entitySelfApplicationVersion.uuid)];
      const configuration = state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityStoreBasedConfiguration.uuid)];
      const endpoints = state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityEndpointVersion.uuid)];
      const entities = state.current[getReduxDeploymentsStateIndex(deploymentUuid, metaModelSection, entityEntity.uuid)];
      const entityDefinitions = state.current[getReduxDeploymentsStateIndex(deploymentUuid, metaModelSection, entityEntityDefinition.uuid)];
      const jzodSchemas = state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityJzodSchema.uuid)];
      const menus = state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityMenu.uuid)];
      const reports = state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityReport.uuid)];
      const queries = state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityQueryVersion.uuid)];
      const result = {
        applicationVersions: (applicationVersions && applicationVersions.entities
          ? Object.values(applicationVersions.entities)
          : []) as ApplicationVersion[],
        applicationVersionCrossEntityDefinition: [],
        configuration: (configuration && configuration.entities
          ? Object.values(configuration.entities)
          : []) as StoreBasedConfiguration[],
        endpoints: (endpoints && endpoints.entities
          ? Object.values(endpoints.entities)
          : []) as MetaModel["endpoints"],
        entities: (entities && entities.entities? Object.values(entities.entities):[]) as MetaEntity[],
        entityDefinitions: (entityDefinitions && entityDefinitions.entities? Object.values(entityDefinitions.entities):[]) as EntityDefinition[],
        jzodSchemas: (jzodSchemas && jzodSchemas.entities? Object.values(jzodSchemas.entities): []) as JzodSchema[],
        menus: (menus && menus.entities? Object.values(menus.entities): []) as Menu[],
        reports: (reports && reports.entities? Object.values(reports.entities):[]) as Report[],
        storedQueries: (queries && queries.entities? Object.values(queries.entities):[]) as Query[],
      }
      // log.info("called currentModel(", deploymentUuid, ") found result:", JSON.stringify(result, null, 2));
      return result;
  }
}

// #########################################################################################
export function currentModelEnvironment(deploymentUuid: string, state:LocalCacheSliceState): MiroirModelEnvironment {
  const model = currentModel(deploymentUuid, state);
  return {
    deploymentUuid: deploymentUuid,
    miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
    miroirMetaModel: defaultMiroirMetaModel,
    currentModel: model,
    endpointsByUuid: model.endpoints.reduce((acc, endpoint) => {
      acc[endpoint.uuid] = endpoint;
      return acc;
    }, {} as {[uuid:string]:any}),
  }
}
