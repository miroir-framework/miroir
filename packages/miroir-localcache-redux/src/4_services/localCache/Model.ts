//#########################################################################################
/**
 * TODO: simila to 
 * miroir-core Model.ts getReportsAndEntitiesForDeploymentUuid, 
 * miroir-core DomainDataAccess.ts selectCurrentDeploymentModel
 * @param deploymentUuid 
 * @param state 
 * @returns 
 */

import {
  type ApplicationDeploymentMap,
  // entityStoredMiroirTheme,
  type ApplicationVersion,
  type Entity,
  type EntityVersion,
  type Menu,
  type MetaModel,
  type MiroirModelEnvironment,
  type MiroirTestDefinition,
  type MlSchema,
  type Query,
  type Report,
  type Runner,
  type SelfApplication,
  type StoredMiroirTheme,
  type Uuid,
  getApplicationSection,
  getMiroirFundamentalSchemaForDeployment,
  getReduxDeploymentsStateIndex
} from "miroir-core";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  defaultMiroirMetaModel, entityDefinitionTheme, entityEndpointVersion, entityEntity,
  entityEntityVersion,
  entityJzodSchema,
  entityMenu, entityMiroirTest, entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplication,
  entitySelfApplicationVersion,
  entityApplicationVersionCrossEntityVersion,
  entityApplicationVersionCrossQueryVersion,
  entityHistoricalQueryVersion,
  entityApplicationVersionCrossReportVersion,
  entityHistoricalReportVersion,
  entityApplicationVersionCrossMenuVersion,
  entityHistoricalMenuVersion,
  entityApplicationVersionCrossEndpointVersion,
  entityHistoricalEndpointVersion,
  entityApplicationVersionCrossRunnerVersion,
  entityHistoricalRunnerVersion,
} from "miroir-test-app_deployment-miroir";
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
    const entityVersionSection = getApplicationSection(
      application,
      entityEntityVersion.uuid
    );
    const selfApplicationSection = getApplicationSection(
      application,
      entitySelfApplication.uuid,
    );
    // Co-locate Cross with SAV (see DomainController.persistFreezeApplicationVersionPlan).
    const crossEntityVersionSection = getApplicationSection(
      application,
      entitySelfApplicationVersion.uuid,
    );
    const applicationVersions =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          modelSection,
          entitySelfApplicationVersion.uuid
        )
      ];
    const applicationVersionCross =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          crossEntityVersionSection,
          entityApplicationVersionCrossEntityVersion.uuid,
        )
      ];
    const applicationVersionCrossQuery =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          crossEntityVersionSection,
          entityApplicationVersionCrossQueryVersion.uuid,
        )
      ];
    const queryVersionSection = getApplicationSection(
      application,
      entityHistoricalQueryVersion.uuid,
    );
    const historicalQueryVersions =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          queryVersionSection,
          entityHistoricalQueryVersion.uuid,
        )
      ];
    const reportVersionSection = getApplicationSection(
      application,
      entityHistoricalReportVersion.uuid,
    );
    const menuVersionSection = getApplicationSection(
      application,
      entityHistoricalMenuVersion.uuid,
    );
    const endpointVersionSection = getApplicationSection(
      application,
      entityHistoricalEndpointVersion.uuid,
    );
    const runnerVersionSection = getApplicationSection(
      application,
      entityHistoricalRunnerVersion.uuid,
    );
    const applicationVersionCrossReport =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          crossEntityVersionSection,
          entityApplicationVersionCrossReportVersion.uuid,
        )
      ];
    const historicalReportVersions =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          reportVersionSection,
          entityHistoricalReportVersion.uuid,
        )
      ];
    const applicationVersionCrossMenu =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          crossEntityVersionSection,
          entityApplicationVersionCrossMenuVersion.uuid,
        )
      ];
    const historicalMenuVersions =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          menuVersionSection,
          entityHistoricalMenuVersion.uuid,
        )
      ];
    const applicationVersionCrossEndpoint =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          crossEntityVersionSection,
          entityApplicationVersionCrossEndpointVersion.uuid,
        )
      ];
    const historicalEndpointVersions =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          endpointVersionSection,
          entityHistoricalEndpointVersion.uuid,
        )
      ];
    const applicationVersionCrossRunner =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          crossEntityVersionSection,
          entityApplicationVersionCrossRunnerVersion.uuid,
        )
      ];
    const historicalRunnerVersions =
      state.current[
        getReduxDeploymentsStateIndex(
          deploymentUuid,
          runnerVersionSection,
          entityHistoricalRunnerVersion.uuid,
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
        getReduxDeploymentsStateIndex(deploymentUuid, entityVersionSection, entityEntityVersion.uuid)
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
    const runners =
      state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityRunner.uuid)];
    const tests =
      state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityMiroirTest.uuid)];
    const themes =
      state.current[getReduxDeploymentsStateIndex(deploymentUuid, modelSection, entityDefinitionTheme.entityUuid)];
    // #216 — SelfApplication instances (not SelfApplicationVersion / SAV)
    const selfApplicationsSlice = state.current[
      getReduxDeploymentsStateIndex(
        deploymentUuid,
        selfApplicationSection,
        entitySelfApplication.uuid,
      )
    ];
    const applications = (
      selfApplicationsSlice?.entities
        ? Object.values(selfApplicationsSlice.entities)
        : []
    ) as SelfApplication[];
    const matchedApplication =
      applications.find((a) => a.uuid === application) ?? applications[0] ?? null;
    const result = {
      applicationUuid: application,
      applicationName: matchedApplication ? matchedApplication.name : "",
      applications,
      applicationVersions: (applicationVersions && applicationVersions.entities
        ? Object.values(applicationVersions.entities)
        : []) as ApplicationVersion[],
      applicationVersionCrossEntityVersion: (applicationVersionCross?.entities
        ? Object.values(applicationVersionCross.entities)
        : []) as MetaModel["applicationVersionCrossEntityVersion"],
      applicationVersionCrossQueryVersion: (applicationVersionCrossQuery?.entities
        ? Object.values(applicationVersionCrossQuery.entities)
        : []) as NonNullable<MetaModel["applicationVersionCrossQueryVersion"]>,
      applicationVersionCrossReportVersion: (applicationVersionCrossReport?.entities
        ? Object.values(applicationVersionCrossReport.entities)
        : []) as NonNullable<MetaModel["applicationVersionCrossReportVersion"]>,
      endpoints: (endpoints && endpoints.entities
        ? Object.values(endpoints.entities)
        : []) as MetaModel["endpoints"],
      entities: 
        (entities && entities.entities
          ? Object.values(entities.entities)
          : []) as Entity[],
      entityVersions: (entityDefinitions && entityDefinitions.entities
        ? Object.values(entityDefinitions.entities)
        : []) as EntityVersion[],
      jzodSchemas: (jzodSchemas && jzodSchemas.entities
        ? Object.values(jzodSchemas.entities)
        : []) as MlSchema[],
      menus: (menus && menus.entities ? Object.values(menus.entities) : []) as Menu[],
      reports: (reports && reports.entities ? Object.values(reports.entities) : []) as Report[],
      runners: (runners && runners.entities ? Object.values(runners.entities) : []) as Runner[],
      storedQueries: (queries && queries.entities
        ? Object.values(queries.entities)
        : []) as Query[],
      queryVersions: (historicalQueryVersions?.entities
        ? Object.values(historicalQueryVersions.entities)
        : []) as NonNullable<MetaModel["queryVersions"]>,
      reportVersions: (historicalReportVersions?.entities
        ? Object.values(historicalReportVersions.entities)
        : []) as NonNullable<MetaModel["reportVersions"]>,
      applicationVersionCrossMenuVersion: (applicationVersionCrossMenu?.entities
        ? Object.values(applicationVersionCrossMenu.entities)
        : []) as NonNullable<MetaModel["applicationVersionCrossMenuVersion"]>,
      menuVersions: (historicalMenuVersions?.entities
        ? Object.values(historicalMenuVersions.entities)
        : []) as NonNullable<MetaModel["menuVersions"]>,
      applicationVersionCrossEndpointVersion: (applicationVersionCrossEndpoint?.entities
        ? Object.values(applicationVersionCrossEndpoint.entities)
        : []) as NonNullable<MetaModel["applicationVersionCrossEndpointVersion"]>,
      endpointVersions: (historicalEndpointVersions?.entities
        ? Object.values(historicalEndpointVersions.entities)
        : []) as NonNullable<MetaModel["endpointVersions"]>,
      applicationVersionCrossRunnerVersion: (applicationVersionCrossRunner?.entities
        ? Object.values(applicationVersionCrossRunner.entities)
        : []) as NonNullable<MetaModel["applicationVersionCrossRunnerVersion"]>,
      runnerVersions: (historicalRunnerVersions?.entities
        ? Object.values(historicalRunnerVersions.entities)
        : []) as NonNullable<MetaModel["runnerVersions"]>,
      tests: (tests && tests.entities ? Object.values(tests.entities) : []) as MiroirTestDefinition[],
      themes: (themes && themes.entities ? Object.values(themes.entities) : []) as StoredMiroirTheme[],
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
  if (process.env.MIROIR_UI_CONTEXT === "1") {
    console.warn(
      "[currentModelEnvironment] deprecated for UI schema access — use React context schemasPerDeployment instead.",
    );
  }
  const deploymentUuid = appliationDeploymentMap[application];
  const model = currentModel(application, appliationDeploymentMap, state);
  return {
    deploymentUuid: deploymentUuid,
    miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(deploymentUuid, model),
    miroirMetaModel: defaultMiroirMetaModel,
    currentModel: model,
    endpointsByUuid: model.endpoints.reduce((acc, endpoint) => {
      acc[endpoint.uuid] = endpoint;
      return acc;
    }, {} as { [uuid: string]: any }),
  };
}
