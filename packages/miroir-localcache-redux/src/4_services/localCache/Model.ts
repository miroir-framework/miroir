//#########################################################################################
/**
 * TODO: simila to 
 * miroir-core Model.ts getReportsAndEntitiesDefinitionsForDeploymentUuid, 
 * miroir-core DomainDataAccess.ts selectCurrentDeploymentModel
 * @param deploymentUuid 
 * @param state 
 * @returns 
 */

import { deployment_Miroir } from "miroir-deployment-admin";
import {
  type MetaModel,
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
import type { LocalCacheSliceState } from "./localCacheReduxSliceInterface";

// #########################################################################################
export function currentModel(
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  // paramDeploymentUuid: string,
  state: LocalCacheSliceState
): MetaModel {
  // log.info(
  //   "called currentModel(",
  //   deploymentUuid,
  //   ") from state:",
  //   Object.keys(state)
  // );

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
      deploymentUuid == deployment_Miroir.uuid ? "data" : "model";
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
    // log.info("called currentModel(", deploymentUuid, ") found result:", JSON.stringify(result, null, 2));
    return result;
  }
}

// #########################################################################################
export function currentModelEnvironment(
  application: Uuid,
  appliationDeploymentMap: ApplicationDeploymentMap,
  // deploymentUuid: string,
  state: LocalCacheSliceState
): MiroirModelEnvironment {
  const deploymentUuid = appliationDeploymentMap[application];
  const model = currentModel(application, appliationDeploymentMap, state);
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
