import {
  entityEndpointVersion,
  entitySelfApplication,
  entitySelfApplicationVersion,
  entitySelfApplicationModelBranch,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entityDefinitionJzodSchema,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionEndpoint,
  entityDefinitionEntity,
  entityDefinitionSelfApplicationModelBranch,
  entityDefinitionSelfApplication,
  entityDefinitionMenu,
  entityDefinitionQuery,
  entityDefinitionSelfApplicationDeploymentConfiguration,
  entityDefinitionEntityDefinition,
  entityDefinitionReport,
  entityDefinitionRunner,
  menuDefaultMiroir,
  reportApplicationVersionList,
  reportApplicationList,
  reportConfigurationList,
  reportEndpointVersionList,
  reportEntityDefinitionDetails,
  reportEntityList,
  reportApplicationDeploymentConfigurationList,
  reportEntityDefinitionList,
  reportEntityDetails,
  reportMenuList,
  reportReportList,
  reportRunnerList,
  reportRunnerDetails,
  reportApplicationModelBranchList,
  reportJzodSchemaList,
  jzodSchemajzodMiroirBootstrapSchema,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication,
  applicationVersionInitialMiroirVersionCrossEntityDefinitionReport,
  selfApplicationVersionInitialMiroirVersion,
  selfApplicationMiroir,
  applicationEndpointV1,
  storeManagementEndpoint as deploymentEndpointV1,
  instanceEndpointV1,
  modelEndpointV1,
  domainEndpointVersionV1,
  testEndpointVersionV1,
  storeManagementEndpoint,
  instanceEndpointVersionV1,
  undoRedoEndpointVersionV1,
  localCacheEndpointVersionV1,
  queryEndpointVersionV1,
  persistenceEndpointVersionV1,
  runnerDropApplication,
  runnerDropEntity,
  defaultStoredMiroirTheme,
  darkStoredMiroirTheme,
  compactStoredMiroirTheme,
  materialStoredMiroirTheme,
  entityTheme,
  entityDefinitionTheme,
} from "miroir-test-app_deployment-miroir";

import { Transform } from "stream";
// import { entityDefinitionEndpoint, reportEndpointVersionList } from "..";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import { MetaEntity, Uuid } from "../0_interfaces/1_core/EntityDefinition";
import type { DeploymentUuidToReportsEntitiesDefinitions } from "../0_interfaces/1_core/Model";
import { miroirFundamentalJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";

import {
  Entity,
  EntityDefinition,
  MlSchema,
  Menu,
  MetaModel,
  Report,
  type ApplicationSection,
  type EndpointDefinition,
  type Runner,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type { EntityInstanceWithName } from "../0_interfaces/1_core/Instance";
// import { Endpoint } from "../3_controllers/Endpoint";

/**
 * TODO: REMOVE THIS, IDEALLY!!! (WAIT, NO, THIS IS OK AS LONG AS IT ALLOWS TO MANAGE DISCREPANCIES BETWEEN 
 * META-APPLICATION AND OTHER APPLICATIONS, AND THIS CONCERNS MAINLY THE META-APPLICATION ITSELF)
 * */
// FIRST: CENTRALIZE LOGIC TO DETERMINE MODEL ENTITIES
export const metaMetaModelEntities: MetaEntity[] = [
  entityEntity as MetaEntity,
  entityEntityDefinition as MetaEntity,
];
export const metaMetaModelEntityUuids: Uuid[] = metaMetaModelEntities.map((e) => e.uuid);

export const metaModelEntities: MetaEntity[] = [
  entitySelfApplication,
  // entitySelfApplicationDeploymentConfiguration, // TODO: remove, deployments are not part of applications, they are external to them, belonging to a separate selfApplication, which contents is specific to each node (no transactions / historization)
  entityEndpointVersion,
  entityEntity, 
  entityEntityDefinition,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplicationModelBranch,
  entitySelfApplicationVersion,
  entityTheme,
  // entityStoreBasedConfiguration,
] as MetaEntity[];

export const metaModelEntityUuids: Uuid[] = metaModelEntities.map((e) => e.uuid);
// console.log("metaModelEntities", metaModelEntities)

export const miroirModelEntities: MetaEntity[] = metaModelEntities.filter((e: MetaEntity) => {
  // console.log("filtering metaModelEntities entity", e)
  return e?.conceptLevel == "MetaModel";
});

export const applicationModelEntities: MetaEntity[] = metaModelEntities.filter(
  (e: MetaEntity) => e?.conceptLevel != "MetaModel"
);

// #################################################################################################
export const defaultMiroirMetaModel: MetaModel = {
  applicationUuid: selfApplicationMiroir.uuid,
  applicationName: selfApplicationMiroir.name,
  // configuration: [instanceConfigurationReference],
  storedQueries: [],
  entities: [
    // this is used in tests, the bootstrap entities have to come first
    entityEntity as Entity,
    entityEntityDefinition as Entity,
    //
    entityEndpointVersion as Entity,
    entityJzodSchema as Entity, // null
    entityMenu as Entity,
    entityQueryVersion as Entity,
    entityReport as Entity,
    entityRunner as Entity,
    entitySelfApplicationVersion as Entity,
    entitySelfApplication as Entity,
    entitySelfApplicationModelBranch as Entity,
    entitySelfApplicationVersion as Entity,
    entityTheme as Entity,
  ],
  entityDefinitions: [
    // bootstrap entities have to come first
    entityDefinitionEntityDefinition as EntityDefinition,
    entityDefinitionEntity as EntityDefinition,
    //
    entityDefinitionEndpoint as EntityDefinition,
    entityDefinitionJzodSchema as EntityDefinition, //
    entityDefinitionMenu as EntityDefinition,
    entityDefinitionQuery as EntityDefinition,
    entityDefinitionReport as EntityDefinition,
    entityDefinitionRunner as EntityDefinition,
    entityDefinitionSelfApplication as EntityDefinition,
    entityDefinitionSelfApplicationModelBranch as EntityDefinition,
    entityDefinitionSelfApplicationVersion as EntityDefinition,
    entityDefinitionTheme as EntityDefinition,
  ],
  endpoints: [
    applicationEndpointV1 as any as EndpointDefinition,
    deploymentEndpointV1 as any as EndpointDefinition,
    instanceEndpointV1 as any as EndpointDefinition,
    modelEndpointV1 as any as EndpointDefinition,
    domainEndpointVersionV1 as any as EndpointDefinition,
    testEndpointVersionV1 as any as EndpointDefinition,
    storeManagementEndpoint as any as EndpointDefinition,
    instanceEndpointVersionV1 as any as EndpointDefinition,
    undoRedoEndpointVersionV1 as any as EndpointDefinition,
    localCacheEndpointVersionV1 as any as EndpointDefinition,
    queryEndpointVersionV1 as any as EndpointDefinition,
    persistenceEndpointVersionV1 as any as EndpointDefinition,
  ],
  jzodSchemas: [jzodSchemajzodMiroirBootstrapSchema as MlSchema],
  menus: [menuDefaultMiroir as Menu],
  applicationVersions: [selfApplicationVersionInitialMiroirVersion],
  reports: [ // TODO: MISSING "DETAILS" REPORTS
    reportApplicationDeploymentConfigurationList as Report,
    reportApplicationList as Report,
    reportApplicationModelBranchList as Report,
    reportApplicationVersionList as Report,
    reportConfigurationList as Report,
    reportEndpointVersionList as Report,
    reportEntityDefinitionList as Report,
    reportEntityList as Report,
    reportJzodSchemaList as Report,
    reportMenuList as Report,
    reportReportList as Report,
    reportRunnerList as Report,
    reportRunnerDetails as Report,
  ],
  runners: [
    runnerDropApplication as Runner,
    runnerDropEntity as any as Runner,
  ],
  applicationVersionCrossEntityDefinition: [
    applicationVersionInitialMiroirVersionCrossEntityDefinitionApplication,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationModelBranch,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionApplicationVersion,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionEntity,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionEntityDefinition,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionReport,
    applicationVersionInitialMiroirVersionCrossEntityDefinitionStoreBasedConfiguration,
  ],
  themes: [
    defaultStoredMiroirTheme,
    darkStoredMiroirTheme,
    compactStoredMiroirTheme,
    materialStoredMiroirTheme,
  ],
};

// #################################################################################################
const defaultEndpointsByUuid: Record<Uuid, EndpointDefinition> = {
  ...Object.fromEntries(
    defaultMiroirMetaModel.endpoints.map((endpoint) => [endpoint.uuid, endpoint]),
  ),
};

export const defaultMetaModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: defaultEndpointsByUuid,
  currentModel: defaultMiroirMetaModel,
};
export const defaultMiroirModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: defaultEndpointsByUuid,
  deploymentUuid: deployment_Miroir.uuid,
  currentModel: defaultMiroirMetaModel,
};

// ################################################################################################
const metaModelReports = [
  reportEntityList.uuid,
  reportEntityDefinitionList.uuid,
  reportEntityDetails.uuid,
  reportEntityDefinitionDetails.uuid,
];

// ################################################################################################
export function getApplicationSection(
  applicationUuid: Uuid,
  entityUuid: Uuid,
): ApplicationSection{
  if (applicationUuid == selfApplicationMiroir.uuid) {
    return metaMetaModelEntityUuids.includes(entityUuid)?"model":"data";
  }
  return metaModelEntityUuids.includes(entityUuid)?"model":"data";
}
// ################################################################################################
/**
 * just filters the model / meta-model reports in the Miroir app for now
 * TODO: DEFUNCT? use useCurrentModel only?
 * @param deploymentUuid 
 * @param metaModel 
 * @param appModel 
 * @returns 
 */
export function getReportsAndEntitiesDefinitionsForDeploymentUuid(
  application: Uuid,
  metaModel: MetaModel,
  appModel: MetaModel
): DeploymentUuidToReportsEntitiesDefinitions
{
  if (application === selfApplicationMiroir.uuid) {
    return {
      model: {
        availableQueries: metaModel.storedQueries,
        availableReports: metaModel.reports.filter((r:Report) => metaModelReports.includes(r.uuid)),
        entities: metaModel.entities,
        entityDefinitions: metaModel.entityDefinitions,
      },
      data: {
        availableQueries: metaModel.storedQueries,
        availableReports: metaModel.reports.filter((r) => !metaModelReports.includes(r.uuid)),
        entities: metaModel.entities,
        entityDefinitions: metaModel.entityDefinitions,
      },
    };
  } else {
    return {
      model: {
        availableQueries: metaModel.storedQueries,
        availableReports: metaModel.reports,
        entities: metaModel.entities,
        entityDefinitions: metaModel.entityDefinitions,
      },
      data: {
        availableQueries: metaModel.storedQueries,
        availableReports: appModel.reports,
        entities: appModel.entities,
        entityDefinitions: appModel.entityDefinitions,
      },
    };
  }
}


const modelIcons: Record<string, string> = {
  Miroir: "hive",
  assistant: "wand_stars", //"smart_toy", //"psychology",
  viewSettings: "instant_mix",
  documentation: "description", //"explore", // "menu_book", "description", "article",
  // 
  Application: "web_asset", // "account_tree", "apps", "bolt"
  ApplicationVersion: "web_asset",
  Deployment: "rocket_launch",// "space_dashboard", "folder", "inventory", "cloud_done",
  Endpoint: "api",//"webhook", //"settings_ethernet", //"api",
  EndpointDefinition: "webhook", //"settings_ethernet", //"api",
  Entity: "category",
  EntityDefinition: "category",
  Menu: "menu", // "menu_book", "list",
  QueryVersion: "query-version",
  Report: "dashboard", //"newspaper", "article", "clarify", 
  Runner: "saved_search",
  Test: "fact_check", //"science", //"bug_report",
  Transformer: "transform",//"function", //"functions", "sync_alt", "transform", "build_circle", "transform", "construction",
  // 
  // 
  // 
  // ApplicationModelBranch: "application-model-branch",
  EndpointVersion: "endpoint-version",
  JzodSchema: "jzod-schema",
  SelfApplication: "self-application",
  SelfApplicationVersion: "self-application-version",
  SelfApplicationModelBranch: "self-application-model-branch",
  // StoreBasedConfiguration: "store-based-configuration",
};