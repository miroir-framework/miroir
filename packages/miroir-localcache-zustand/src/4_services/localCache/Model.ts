/**
 * Model helper functions for Zustand-based local cache.
 * Provides functions to extract MetaModel from state.
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
  type MlSchema,
  type Menu,
  type Report,
  type Query,
  type MiroirModelEnvironment,
  miroirFundamentalJzodSchema,
  defaultMiroirMetaModel,
  entityEndpointVersion,
  type Uuid,
  type ApplicationDeploymentMap,
} from "miroir-core";
import type { LocalCacheSliceState } from "./localCacheZustandInterface.js";

// #########################################################################################
export function currentModel(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  state: LocalCacheSliceState
): MetaModel {
  const deploymentUuid = applicationDeploymentMap[application];

  if (!deploymentUuid) {
    throw new Error(
      "currentModel() called, could not find deploymentUuid for application " +
        application +
        " in applicationDeploymentMap: " +
        JSON.stringify(Object.keys(applicationDeploymentMap), null, 2)
    );
  } else {
    const metaModelSection = "model";
    const modelSection =
      deploymentUuid == adminConfigurationDeploymentMiroir.uuid ? "data" : "model";
    const applicationVersions =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          modelSection,
          entitySelfApplicationVersion.uuid
        )
      ];
    const configuration =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          modelSection,
          entityStoreBasedConfiguration.uuid
        )
      ];
    const endpoints =
      state.current[
        getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityEndpointVersion.uuid)
      ];
    const entities =
      state.current[
        getReduxDeploymentsStateIndex(deploymentUuid, metaModelSection, entityEntity.uuid)
      ];
    const entityDefinitions =
      state.current[
        getReduxDeploymentsStateIndex(deploymentUuid, metaModelSection, entityEntityDefinition.uuid)
      ];
    const jzodSchemas =
      state.current[
        getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityJzodSchema.uuid)
      ];
    const menus =
      state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityMenu.uuid)];
    const reports =
      state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityReport.uuid)];
    const queries =
      state.current[
        getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityQueryVersion.uuid)
      ];
    const currentApplicationDefinitions = state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          metaModelSection,
          entitySelfApplicationVersion.uuid
        )
      ]?.entities;
    const currentApplicationDefinition = currentApplicationDefinitions
      ? Object.values(currentApplicationDefinitions)[0]
      : null;
    const result = {
      applicationUuid: application,
      applicationName: currentApplicationDefinition
        ? (currentApplicationDefinition as any).name
        : "",
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
      entities: (entities && entities.entities
        ? Object.values(entities.entities)
        : []) as MetaEntity[],
      entityDefinitions: (entityDefinitions && entityDefinitions.entities
        ? Object.values(entityDefinitions.entities)
        : []) as EntityDefinition[],
      jzodSchemas: (jzodSchemas && jzodSchemas.entities
        ? Object.values(jzodSchemas.entities)
        : []) as MlSchema[],
      menus: (menus && menus.entities ? Object.values(menus.entities) : []) as Menu[],
      reports: (reports && reports.entities ? Object.values(reports.entities) : []) as Report[],
      storedQueries: (queries && queries.entities
        ? Object.values(queries.entities)
        : []) as Query[],
    };
    return result;
  }
}

// #########################################################################################
export function currentModelEnvironment(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  state: LocalCacheSliceState
): MiroirModelEnvironment {
  const deploymentUuid = applicationDeploymentMap[application];
  const model = currentModel(application, applicationDeploymentMap, state);
  return {
    deploymentUuid: deploymentUuid,
    miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
    miroirMetaModel: defaultMiroirMetaModel,
    currentModel: model,
    endpointsByUuid: model.endpoints.reduce((acc, endpoint) => {
      acc[endpoint.uuid] = endpoint;
      return acc;
    }, {} as { [uuid: string]: any }),
  };
}
