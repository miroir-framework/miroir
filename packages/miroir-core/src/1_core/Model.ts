import {
  entityEndpointVersion,
  entityEntity,
  entityEntityVersion,
  entityJzodSchema,
  entityMenu,
  entityMiroirTest,
  entityQueryVersion,
  entityHistoricalQueryVersion,
  entityHistoricalReportVersion,
  entityHistoricalMenuVersion,
  entityHistoricalEndpointVersion,
  entityHistoricalRunnerVersion,
  entityHistoricalThemeVersion,
  entityHistoricalTransformerDefinitionVersion,
  entityReport,
  entityRunner,
  entitySelfApplication,
  entitySelfApplicationModelBranch,
  entitySelfApplicationVersion,
  entityApplicationVersionCrossEntityVersion,
  entityApplicationVersionCrossQueryVersion,
  entityApplicationVersionCrossReportVersion,
  entityApplicationVersionCrossMenuVersion,
  entityApplicationVersionCrossEndpointVersion,
  entityApplicationVersionCrossRunnerVersion,
  entityApplicationVersionCrossThemeVersion,
  entityApplicationVersionCrossTransformerDefinitionVersion,
  entityTheme,
  entityTransformerDefinition,
  reportEntityDefinitionDetails,
  reportEntityDefinitionList,
  reportEntityDetails,
  reportEntityList,
  reportApplicationVersionList,
  reportApplicationVersionDetails,
  selfApplicationMiroir
} from "miroir-test-app_deployment-miroir";

import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import { Uuid } from "../0_interfaces/1_core/EntityVersion";
import type { DeploymentUuidToReportsEntities } from "../0_interfaces/1_core/Model";
import { resolveFundamentalSchemaForDeployment } from "./jzod/schemaForDeployment";
import { defaultMiroirMetaModel } from "./defaultMiroirMetaModel";

import {
  Entity,
  EntityVersion,
  Menu,
  MetaModel,
  MlSchema,
  Report,
  type ApplicationSection,
  type ApplicationVersion,
  type DataSet,
  type EndpointDefinition,
  type MiroirTestDefinition,
  type Query,
  type Runner,
  type SelfApplication,
  type StoredMiroirTheme,
  type TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { Action2Error, Domain2ElementFailed } from "../0_interfaces/2_domain/DomainElement";
import type { PersistenceStoreControllerInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
// import { Endpoint } from "../3_controllers/Endpoint";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Model");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => { log = logger; });


const genType = { // <X> -> X[]
  type: "schemaReference",
  context: {
    x: { type: "var" },
    res: { type: "array", definition: { type: "schemaReference", relativePath: "x" } },
    relativePath: "x",
  }
}
/**
 * MetaModel bootstrap for the Miroir (meta-)app: Entity only.
 * EntityVersion is an ordinary Model concept; Miroir instances live in the data section (#222).
 */
export const metaMetaModelEntities: Entity[] = [
  entityEntity as Entity,
];
export const metaMetaModelEntityUuids: Uuid[] = metaMetaModelEntities.map((e) => e.uuid!);

export const metaModelEntities: Entity[] = defaultMiroirMetaModel.entities;

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
const defaultEndpointsByUuid: Record<Uuid, EndpointDefinition> = {
  ...Object.fromEntries(
    defaultMiroirMetaModel.endpoints.map((endpoint) => [endpoint.uuid, endpoint]),
  ),
};

export const defaultMetaModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: resolveFundamentalSchemaForDeployment(
    deployment_Miroir.uuid,
    defaultMiroirMetaModel,
    "static",
  ),
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: defaultEndpointsByUuid,
  currentModel: defaultMiroirMetaModel,
};
export const defaultMiroirModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: resolveFundamentalSchemaForDeployment(
    deployment_Miroir.uuid,
    defaultMiroirMetaModel,
    "static",
  ),
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: defaultEndpointsByUuid,
  deploymentUuid: deployment_Miroir.uuid,
  currentModel: defaultMiroirMetaModel,
};

// ################################################################################################
const metaModelModelReports = [
  reportEntityList.uuid,
  reportEntityDetails.uuid,
];

const metaModelVersionReports = [
  reportEntityDefinitionList.uuid,
  reportEntityDefinitionDetails.uuid,
  reportApplicationVersionList.uuid,
  reportApplicationVersionDetails.uuid,
];

// ################################################################################################
/**
 * #232 — entity UUIDs whose instances always belong to `modelVersion`.
 * Checked first in getApplicationSection; independent of application UUID.
 */
export const versionHistoryEntityUuids: ReadonlySet<string> = new Set([
  entityEntityVersion.uuid!,
  entitySelfApplicationVersion.uuid!,
  entityApplicationVersionCrossEntityVersion.uuid!,
  entityHistoricalQueryVersion.uuid!,
  entityApplicationVersionCrossQueryVersion.uuid!,
  entityHistoricalReportVersion.uuid!,
  entityApplicationVersionCrossReportVersion.uuid!,
  entityHistoricalMenuVersion.uuid!,
  entityApplicationVersionCrossMenuVersion.uuid!,
  entityHistoricalEndpointVersion.uuid!,
  entityApplicationVersionCrossEndpointVersion.uuid!,
  entityHistoricalRunnerVersion.uuid!,
  entityApplicationVersionCrossRunnerVersion.uuid!,
  entityHistoricalThemeVersion.uuid!,
  entityApplicationVersionCrossThemeVersion.uuid!,
  entityHistoricalTransformerDefinitionVersion.uuid!,
  entityApplicationVersionCrossTransformerDefinitionVersion.uuid!,
]);

const versionHistoryEntityDefinitions: ReadonlyMap<string, Entity> = new Map([
  [entityEntityVersion.uuid!, entityEntityVersion as Entity],
  [entitySelfApplicationVersion.uuid!, entitySelfApplicationVersion as Entity],
  [entityApplicationVersionCrossEntityVersion.uuid!, entityApplicationVersionCrossEntityVersion as Entity],
  [entityHistoricalQueryVersion.uuid!, entityHistoricalQueryVersion as Entity],
  [entityApplicationVersionCrossQueryVersion.uuid!, entityApplicationVersionCrossQueryVersion as Entity],
  [entityHistoricalReportVersion.uuid!, entityHistoricalReportVersion as Entity],
  [entityApplicationVersionCrossReportVersion.uuid!, entityApplicationVersionCrossReportVersion as Entity],
  [entityHistoricalMenuVersion.uuid!, entityHistoricalMenuVersion as Entity],
  [entityApplicationVersionCrossMenuVersion.uuid!, entityApplicationVersionCrossMenuVersion as Entity],
  [entityHistoricalEndpointVersion.uuid!, entityHistoricalEndpointVersion as Entity],
  [entityApplicationVersionCrossEndpointVersion.uuid!, entityApplicationVersionCrossEndpointVersion as Entity],
  [entityHistoricalRunnerVersion.uuid!, entityHistoricalRunnerVersion as Entity],
  [entityApplicationVersionCrossRunnerVersion.uuid!, entityApplicationVersionCrossRunnerVersion as Entity],
  [entityHistoricalThemeVersion.uuid!, entityHistoricalThemeVersion as Entity],
  [entityApplicationVersionCrossThemeVersion.uuid!, entityApplicationVersionCrossThemeVersion as Entity],
  [entityHistoricalTransformerDefinitionVersion.uuid!, entityHistoricalTransformerDefinitionVersion as Entity],
  [
    entityApplicationVersionCrossTransformerDefinitionVersion.uuid!,
    entityApplicationVersionCrossTransformerDefinitionVersion as Entity,
  ],
]);

/** Bootstrap Entity row for a version-history parent entity (SQL modelVersion lazy table creation). */
export function getVersionHistoryEntityDefinition(entityUuid: string): Entity | undefined {
  return versionHistoryEntityDefinitions.get(entityUuid);
}

// ################################################################################################
export function getApplicationSection(
  applicationUuid: Uuid,
  entityUuid: Uuid,
): ApplicationSection {
  // #232: version-history entities always live in modelVersion regardless of application
  if (versionHistoryEntityUuids.has(entityUuid)) return "modelVersion";
  if (applicationUuid == selfApplicationMiroir.uuid) {
    return metaMetaModelEntityUuids.includes(entityUuid) ? "model" : "data";
  }
  return metaModelEntityUuids.includes(entityUuid) ? "model" : "data";
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
export function getReportsAndEntitiesForDeploymentUuid(
  application: Uuid,
  metaModel: MetaModel,
  appModel: MetaModel
): DeploymentUuidToReportsEntities
{
  if (application === selfApplicationMiroir.uuid) {
    return {
      model: {
        availableQueries: metaModel.storedQueries,
        availableReports: metaModel.reports.filter((r: Report) =>
          metaModelModelReports.includes(r.uuid),
        ),
        entities: metaModel.entities,
        entityVersions: metaModel.entityVersions,
      },
      modelVersion: {
        availableQueries: metaModel.storedQueries,
        availableReports: metaModel.reports.filter((r: Report) =>
          metaModelVersionReports.includes(r.uuid),
        ),
        entities: metaModel.entities,
        entityVersions: metaModel.entityVersions,
      },
      data: {
        availableQueries: metaModel.storedQueries,
        availableReports: metaModel.reports.filter(
          (r) =>
            !metaModelModelReports.includes(r.uuid) &&
            !metaModelVersionReports.includes(r.uuid),
        ),
        entities: metaModel.entities,
        entityVersions: metaModel.entityVersions,
      },
    };
  } else {
    return {
      model: {
        availableQueries: metaModel.storedQueries,
        availableReports: metaModel.reports,
        entities: metaModel.entities,
        entityVersions: metaModel.entityVersions,
      },
      data: {
        availableQueries: metaModel.storedQueries,
        availableReports: appModel.reports,
        entities: appModel.entities,
        entityVersions: appModel.entityVersions,
      },
    };
  }
}

export const emptyApplicationModel: MetaModel = {
  applicationUuid: "",
  applicationName: "",
  applications: [],
  applicationVersions: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applicationVersionCrossRunnerVersion: [],
  runnerVersions: [],
  applicationVersionCrossThemeVersion: [],
  themeVersions: [],
  applicationVersionCrossTransformerDefinitionVersion: [],
  transformerDefinitionVersions: [],
  endpoints: [],
  entities: [],
  entityVersions: [],
  jzodSchemas: [],
  menus: [],
  reports: [],
  runners: [],
  storedQueries: [],
  tests: [],
  themes: [],
  transformerDefinitions: [],
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
  EntityVersion: "category",
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
  RunnerVersion: "runner-version",
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
  log.debug(`   - Reading ${entityName}...`);
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
  log.debug(`     Found ${instances.length} ${entityName}`);
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
): Promise<MetaModel> {
  try {
    // Read all model elements from the store
    log.debug("\n7. Reading model elements from filesystem store...");

    // Extract all entities
    // #222 — section per concept (Miroir EntityVersion → data; Library MetaModel peers → model)
    const sectionFor = (entityUuid: Uuid) => getApplicationSection(applicationUuid, entityUuid);

    const entities = await extractEntityInstances(storeController, sectionFor(entityEntity.uuid), entityEntity.uuid, "entities");
    const entityDefinitions = await extractEntityInstances(storeController, sectionFor(entityEntityVersion.uuid), entityEntityVersion.uuid, "entity definitions");
    const endpoints = await extractEntityInstances(storeController, sectionFor(entityEndpointVersion.uuid), entityEndpointVersion.uuid, "endpoints");
    const menus = await extractEntityInstances(storeController, sectionFor(entityMenu.uuid), entityMenu.uuid, "menus");
    const reports = await extractEntityInstances(storeController, sectionFor(entityReport.uuid), entityReport.uuid, "reports");
    const jzodSchemas = await extractEntityInstances(storeController, sectionFor(entityJzodSchema.uuid), entityJzodSchema.uuid, "jzod schemas");
    const queries = await extractEntityInstances(storeController, sectionFor(entityQueryVersion.uuid), entityQueryVersion.uuid, "queries");
    const runners = await extractEntityInstances(storeController, sectionFor(entityRunner.uuid), entityRunner.uuid, "runners");
    const themes = await extractEntityInstances(storeController, sectionFor(entityTheme.uuid), entityTheme.uuid, "themes");
    const transformerDefinitions = await extractEntityInstances(
      storeController,
      sectionFor(entityTransformerDefinition.uuid),
      entityTransformerDefinition.uuid,
      "transformer definitions",
    );
    const tests = await extractEntityInstances(storeController, sectionFor(entityMiroirTest.uuid), entityMiroirTest.uuid, "tests");
    // 
    const applications = await extractEntityInstances(storeController, sectionFor(entitySelfApplication.uuid), entitySelfApplication.uuid, "applications");
    const applicationVersions = await extractEntityInstances(storeController, sectionFor(entitySelfApplicationVersion.uuid), entitySelfApplicationVersion.uuid, "application versions");

    // Assemble the MetaModel
    log.debug("\n8. Assembling MetaModel structure...");
    const libraryMetaModel: MetaModel = {
      applicationUuid: applicationUuid,
      applicationName: applicationName,
      applications: applications as SelfApplication[],
      entities: entities as Entity[],
      entityVersions: entityDefinitions as EntityVersion[],
      endpoints: endpoints as EndpointDefinition[],
      menus: menus as Menu[],
      reports: reports as Report[],
      storedQueries: queries as Query[],
      jzodSchemas: jzodSchemas as MlSchema[],
      applicationVersions: applicationVersions as ApplicationVersion[],
      applicationVersionCrossEntityVersion: [],
      applicationVersionCrossQueryVersion: [],
      queryVersions: [], // These would need to be read separately if needed
      applicationVersionCrossReportVersion: [],
      reportVersions: [],
      applicationVersionCrossMenuVersion: [],
      menuVersions: [],
      applicationVersionCrossEndpointVersion: [],
      endpointVersions: [],
      applicationVersionCrossRunnerVersion: [],
      runnerVersions: [],
      applicationVersionCrossThemeVersion: [],
      themeVersions: [],
      applicationVersionCrossTransformerDefinitionVersion: [],
      transformerDefinitionVersions: [],
      runners: runners as Runner[], 
      tests: tests as MiroirTestDefinition[],
      themes: themes as StoredMiroirTheme[],
      transformerDefinitions: transformerDefinitions as TransformerDefinition[],
    };

    return libraryMetaModel;
  } catch (error) {
    log.error("Error extracting Library MetaModel:");
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
    log.debug("\nExtracting data sets from filesystem store...");

    const instances = await Promise.all(entities.map(entity => 
      extractEntityInstances(storeController, "data", entity.uuid, entity.name)
    ));

    return Promise.resolve({
      applicationUuid: applicationUuid,
      instances: instances.flat() // Flatten the array of arrays into a single array of instances
    });
  } catch (error) {
    log.error("Error extracting data sets:");
    throw error;
  }
}
