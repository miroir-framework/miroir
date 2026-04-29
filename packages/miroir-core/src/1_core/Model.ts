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
import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
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
  type ApplicationVersion,
  type StoredMiroirTheme,
  type Query,
  type DataSet,
  type SelfApplication,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type { EntityInstanceWithName } from "../0_interfaces/1_core/Instance";
import type { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { Action2Error, Domain2ElementFailed } from "../0_interfaces/2_domain/DomainElement";
// import { Endpoint } from "../3_controllers/Endpoint";

/**
 * TODO: REMOVE THIS, IDEALLY!!! (WAIT, NO, THIS IS OK AS LONG AS IT ALLOWS TO MANAGE DISCREPANCIES BETWEEN 
 * META-APPLICATION AND OTHER APPLICATIONS, AND THIS CONCERNS MAINLY THE META-APPLICATION ITSELF)
 * */
// FIRST: CENTRALIZE LOGIC TO DETERMINE MODEL ENTITIES
export const metaMetaModelEntities: Entity[] = [
  entityEntity as Entity,
  entityEntityDefinition as Entity,
];
export const metaMetaModelEntityUuids: Uuid[] = metaMetaModelEntities.map((e) => e.uuid!);

export const metaModelEntities: Entity[] = [
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
] as Entity[];

export const metaModelEntityUuids: Uuid[] = metaModelEntities.map((e) => e.uuid);
// console.log("metaModelEntities", metaModelEntities)

export const miroirModelEntities: Entity[] = metaModelEntities.filter((e: Entity) => {
  // console.log("filtering metaModelEntities entity", e)
  return e?.conceptLevel == "MetaModel";
});

export const applicationModelEntities: Entity[] = metaModelEntities.filter(
  (e: Entity) => e?.conceptLevel != "MetaModel"
);

// #################################################################################################
export const defaultMiroirMetaModel: MetaModel = {
  applicationUuid: selfApplicationMiroir.uuid,
  applicationName: selfApplicationMiroir.name,
  // configuration: [instanceConfigurationReference],
  storedQueries: [],
  applications: [
    selfApplicationMiroir
  ],
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

export const emptyApplicationModel: MetaModel = {
  applicationUuid: "",
  applicationName: "",
  applications: [],
  applicationVersions: [],
  applicationVersionCrossEntityDefinition: [],
  endpoints: [],
  entities: [],
  entityDefinitions: [],
  jzodSchemas: [],
  menus: [],
  reports: [],
  runners: [],
  storedQueries: [],
  themes: [],
}

// ################################################################################################
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


// ###############################################################################################
/**
 * Extracts instances of a specific entity from the store.
 * @param storeController - The persistence store controller.
 * @param entityUuid - The UUID of the entity to extract instances for.
 * @param entityName - The name of the entity (for logging purposes).
 * @returns An array of instances of the specified entity.
 */
export async function extractEntityInstances(
  storeController: PersistenceStoreControllerInterface,
  applicationSection: ApplicationSection,
  entityUuid: string,
  entityName: string,
) {
  console.log(`   - Reading ${entityName}...`);
  const result = await storeController.getInstances(applicationSection, entityUuid);

  if (result instanceof Action2Error) {
    throw new Error(`Error reading ${entityName}: ${result}`);
  }
  if (result.returnedDomainElement instanceof Domain2ElementFailed) {
    throw new Error(
      `Domain2Element conversion failed for ${entityName}: ${result.returnedDomainElement}`,
    );
  }

  const instances = result.status === "ok" ? result.returnedDomainElement.instances : [];
  console.log(`     Found ${instances.length} ${entityName}`);
  return instances;
}

// ##############################################################################################
/**
 * Extracts the complete MetaModel from a filesystem-deployed Library application.
 * This script mounts the store, reads all model elements dynamically, and outputs a JSON file.
 */
export async function extractApplicationModel(
  storeController: PersistenceStoreControllerInterface,
  applicationUuid: Uuid,
  applicationName: string,
  // persistenceStoreControllerManager: PersistenceStoreControllerManager
) {
  try {
    // Read all model elements from the store
    console.log("\n7. Reading model elements from filesystem store...");

    // Extract all entities
    const entities = await extractEntityInstances(storeController, "model", entityEntity.uuid, "entities");
    const entityDefinitions = await extractEntityInstances(storeController, "model", entityEntityDefinition.uuid, "entity definitions");
    const endpoints = await extractEntityInstances(storeController, "model", entityEndpointVersion.uuid, "endpoints");
    const menus = await extractEntityInstances(storeController, "model", entityMenu.uuid, "menus");
    const reports = await extractEntityInstances(storeController, "model", entityReport.uuid, "reports");
    const jzodSchemas = await extractEntityInstances(storeController, "model", entityJzodSchema.uuid, "jzod schemas");
    const queries = await extractEntityInstances(storeController, "model", entityQueryVersion.uuid, "queries");
    const runners = await extractEntityInstances(storeController, "model", entityRunner.uuid, "runners");
    const themes = await extractEntityInstances(storeController, "model", entityTheme.uuid, "themes");
    // 
    const applications = await extractEntityInstances(storeController, "model", entitySelfApplication.uuid, "applications");
    const applicationVersions = await extractEntityInstances(storeController, "model", entitySelfApplicationVersion.uuid, "application versions");

    // Assemble the MetaModel
    console.log("\n8. Assembling MetaModel structure...");
    const libraryMetaModel: MetaModel = {
      applicationUuid: applicationUuid,
      applicationName: applicationName,
      applications: applications as SelfApplication[],
      entities: entities as Entity[],
      entityDefinitions: entityDefinitions as EntityDefinition[],
      endpoints: endpoints as EndpointDefinition[],
      menus: menus as Menu[],
      reports: reports as Report[],
      storedQueries: queries as Query[],
      jzodSchemas: jzodSchemas as MlSchema[],
      applicationVersions: applicationVersions as ApplicationVersion[],
      applicationVersionCrossEntityDefinition: [], // These would need to be read separately if needed
      runners: runners as Runner[], 
      themes: themes as StoredMiroirTheme[], // Themes are now included in the model extraction
    };

    return libraryMetaModel;
  } catch (error) {
    console.error("Error extracting Library MetaModel:");
    throw error;
  }
}

// ##############################################################################################
export async function extractApplicationData(
  storeController: PersistenceStoreControllerInterface,
  applicationUuid: Uuid,
  entities: Entity[],
): Promise<DataSet> {
  try {
    console.log("\nExtracting data sets from filesystem store...");

    const instances = await Promise.all(entities.map(entity => 
      extractEntityInstances(storeController, "data", entity.uuid, entity.name)
    ));

    return Promise.resolve({
      applicationUuid: applicationUuid,
      instances: instances.flat() // Flatten the array of arrays into a single array of instances
    });
  } catch (error) {
    console.error("Error extracting data sets:");
    throw error;
  }
}
