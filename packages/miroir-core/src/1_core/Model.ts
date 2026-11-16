import {
  entityEndpointVersion,
  entityEntity,
  entityEntityVersion,
  entityMlSchema,
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
  entityHistoricalMlSchemaVersion,
  entityHistoricalMiroirTestVersion,
  entityHistoricalBlobVersion,
  entityHistoricalTestConfigurationVersion,
  entityHistoricalTestVersion,
  entityEvolutionTraceRecord,
  entityMigration,
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
  entityApplicationVersionCrossMlSchemaVersion,
  entityApplicationVersionCrossMiroirTestVersion,
  entityApplicationVersionCrossBlobVersion,
  entityApplicationVersionCrossTestConfigurationVersion,
  entityApplicationVersionCrossTestVersion,
  entityTheme,
  entityTransformerDefinition,
  entityBundleSizeMeasurement,
  entityPageLoadMeasurement,
  entityBlob,
  entityCommit,
  entityTest,
  entityTestConfiguration,
  reportEntityDefinitionDetails,
  reportEntityDefinitionList,
  reportEntityDetails,
  reportEntityList,
  reportApplicationVersionList,
  reportApplicationVersionDetails,
  reportBundleSizeHistory,
  reportBundleSizeMeasurementDetails,
  reportPageLoadHistory,
  reportPageLoadMeasurementDetails,
  selfApplicationMiroir,
  defaultMiroirMetaModel as defaultMiroirMetaModelRaw,
} from "miroir-app-miroir";

import { deployment_Miroir } from "miroir-app-admin";
import { miroirFundamentalMlSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalMlSchema";
import { Uuid } from "../0_interfaces/1_core/EntityVersion";
import type { DeploymentUuidToReportsEntities } from "../0_interfaces/1_core/Model";

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

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Model");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => { log = logger; });

/**
 * miroir-app-miroir's stub .d.ts types this export as MetaModel, but that
 * resolution can fall back to `any` during miroir-core's own declaration-emit build (circular
 * DTS: the stub's MetaModel type is itself imported from miroir-core). Cast once at this
 * boundary so declaration emission doesn't lose the type here.
 */
const defaultMiroirMetaModel = defaultMiroirMetaModelRaw as unknown as MetaModel;

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

/**
 * The meta-model environment of Miroir's own model (fundamental schema, meta-model, endpoints).
 * @public
 */
export const defaultMetaModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalMlSchema: miroirFundamentalMlSchema as MlSchema,
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: defaultEndpointsByUuid,
  currentModel: defaultMiroirMetaModel,
};
export const defaultMiroirModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalMlSchema: miroirFundamentalMlSchema as MlSchema,
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

/**
 * #647 — the Miroir Reports of the devData section (bundle sizes, page loads; agent runs moved to
 * the AgentRuns application in #671). They are
 * Miroir's, and open on the devData section of any application.
 */
export const metaModelDevDataReports: readonly string[] = [
  reportBundleSizeHistory.uuid,
  reportBundleSizeMeasurementDetails.uuid,
  reportPageLoadHistory.uuid,
  reportPageLoadMeasurementDetails.uuid,
];

// ################################################################################################
/**
 * #708 D7-a — the collections of a {@link MetaModel}, one per Entity of the meta-application.
 */
export type MetaModelCollection = Exclude<keyof MetaModel, "applicationUuid" | "applicationName">;

/**
 * #708 D7-a — one entry per Entity of the meta-application: the section its rows belong to in an
 * application (`model`, the version history `modelVersion` (#232), or `devData` (#647)), and the
 * `MetaModel` collection that holds them. An Entity without a collection is not part of an application's
 * model: `Commit` is Miroir's own transaction log (its rows are in Miroir's data only), the `devData`
 * Entities are application data, and `Test` with its history is retired (#726).
 * `metaModelCollections.unit.test.ts` checks this list against Miroir's Entity files and the MetaModel schema.
 */
export type MetaModelEntityListEntry = {
  entity: Entity;
  section: "model" | "modelVersion" | "devData";
  collection?: MetaModelCollection;
};

export const metaModelEntityList: readonly MetaModelEntityListEntry[] = [
  { entity: entityEntity as Entity, section: "model", collection: "entities" },
  { entity: entityEndpointVersion as Entity, section: "model", collection: "endpoints" }, // the Endpoint Entity
  { entity: entityMlSchema as Entity, section: "model", collection: "mlSchemas" },
  { entity: entityMenu as Entity, section: "model", collection: "menus" },
  { entity: entityQueryVersion as Entity, section: "model", collection: "storedQueries" }, // the Query Entity
  { entity: entityReport as Entity, section: "model", collection: "reports" },
  { entity: entityRunner as Entity, section: "model", collection: "runners" },
  { entity: entitySelfApplication as Entity, section: "model", collection: "applications" },
  { entity: entitySelfApplicationModelBranch as Entity, section: "model", collection: "applicationModelBranches" },
  { entity: entityMiroirTest as Entity, section: "model", collection: "tests" },
  { entity: entityTestConfiguration as Entity, section: "model", collection: "testConfigurations" },
  { entity: entityTheme as Entity, section: "model", collection: "themes" },
  { entity: entityBlob as Entity, section: "model", collection: "blobs" },
  { entity: entityTransformerDefinition as Entity, section: "model", collection: "transformerDefinitions" },
  { entity: entityCommit as Entity, section: "model" },
  { entity: entityTest as Entity, section: "model" },
  { entity: entityEntityVersion as Entity, section: "modelVersion", collection: "entityVersions" },
  { entity: entitySelfApplicationVersion as Entity, section: "modelVersion", collection: "applicationVersions" },
  { entity: entityApplicationVersionCrossEntityVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossEntityVersion" },
  { entity: entityHistoricalQueryVersion as Entity, section: "modelVersion", collection: "queryVersions" },
  { entity: entityApplicationVersionCrossQueryVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossQueryVersion" },
  { entity: entityHistoricalReportVersion as Entity, section: "modelVersion", collection: "reportVersions" },
  { entity: entityApplicationVersionCrossReportVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossReportVersion" },
  { entity: entityHistoricalMenuVersion as Entity, section: "modelVersion", collection: "menuVersions" },
  { entity: entityApplicationVersionCrossMenuVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossMenuVersion" },
  { entity: entityHistoricalEndpointVersion as Entity, section: "modelVersion", collection: "endpointVersions" },
  { entity: entityApplicationVersionCrossEndpointVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossEndpointVersion" },
  { entity: entityHistoricalRunnerVersion as Entity, section: "modelVersion", collection: "runnerVersions" },
  { entity: entityApplicationVersionCrossRunnerVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossRunnerVersion" },
  { entity: entityHistoricalThemeVersion as Entity, section: "modelVersion", collection: "themeVersions" },
  { entity: entityApplicationVersionCrossThemeVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossThemeVersion" },
  { entity: entityHistoricalTransformerDefinitionVersion as Entity, section: "modelVersion", collection: "transformerDefinitionVersions" },
  {
    entity: entityApplicationVersionCrossTransformerDefinitionVersion as Entity,
    section: "modelVersion",
    collection: "applicationVersionCrossTransformerDefinitionVersion",
  },
  { entity: entityHistoricalMlSchemaVersion as Entity, section: "modelVersion", collection: "mlSchemaVersions" },
  { entity: entityApplicationVersionCrossMlSchemaVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossMlSchemaVersion" },
  { entity: entityHistoricalMiroirTestVersion as Entity, section: "modelVersion", collection: "miroirTestVersions" },
  { entity: entityApplicationVersionCrossMiroirTestVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossMiroirTestVersion" },
  { entity: entityHistoricalBlobVersion as Entity, section: "modelVersion", collection: "blobVersions" },
  { entity: entityApplicationVersionCrossBlobVersion as Entity, section: "modelVersion", collection: "applicationVersionCrossBlobVersion" },
  { entity: entityHistoricalTestConfigurationVersion as Entity, section: "modelVersion", collection: "testConfigurationVersions" },
  {
    entity: entityApplicationVersionCrossTestConfigurationVersion as Entity,
    section: "modelVersion",
    collection: "applicationVersionCrossTestConfigurationVersion",
  },
  { entity: entityHistoricalTestVersion as Entity, section: "modelVersion" },
  { entity: entityApplicationVersionCrossTestVersion as Entity, section: "modelVersion" },
  { entity: entityEvolutionTraceRecord as Entity, section: "modelVersion", collection: "evolutionTraceRecords" },
  { entity: entityMigration as Entity, section: "modelVersion", collection: "migrations" },
  { entity: entityBundleSizeMeasurement as Entity, section: "devData" },
  { entity: entityPageLoadMeasurement as Entity, section: "devData" },
];

/**
 * #708 D7-a — the Entities that have a {@link MetaModel} collection, with that collection.
 */
export const metaModelCollections: readonly { entity: Entity; section: "model" | "modelVersion"; collection: MetaModelCollection }[] =
  metaModelEntityList.filter(
    (entry): entry is MetaModelEntityListEntry & { section: "model" | "modelVersion"; collection: MetaModelCollection } =>
      entry.collection !== undefined && entry.section !== "devData",
  );

/**
 * #708 D7-a — a MetaModel's collections, each holding the rows that `rows` gives for its entry of
 * {@link metaModelCollections} (and its index there).
 */
export function buildMetaModelCollections(
  rows: (entry: (typeof metaModelCollections)[number], index: number) => readonly unknown[],
): Pick<MetaModel, MetaModelCollection> {
  return Object.fromEntries(
    metaModelCollections.map((entry, index) => [entry.collection, rows(entry, index)]),
  ) as Pick<MetaModel, MetaModelCollection>;
}

/**
 * #708 D7-a — every collection of an application's MetaModel, each read from the section its Entity's
 * rows belong to in that application (#222). A section the deployment does not have reads as empty (#647).
 */
export async function readMetaModelCollections(
  applicationUuid: Uuid,
  read: (section: ApplicationSection, entityUuid: Uuid, collection: MetaModelCollection) => Promise<unknown[]>,
): Promise<Pick<MetaModel, MetaModelCollection>> {
  const rows = await Promise.all(
    metaModelCollections.map(({ entity, collection }) =>
      read(getApplicationSection(applicationUuid, entity.uuid), entity.uuid, collection),
    ),
  );
  return buildMetaModelCollections((_entry, index) => rows[index]);
}

/** #708 D7-a — a MetaModel's collections, all empty. */
export function emptyMetaModelCollections(): Pick<MetaModel, MetaModelCollection> {
  return buildMetaModelCollections(() => []);
}

function entityDefinitionsOfSection(section: MetaModelEntityListEntry["section"]): ReadonlyMap<string, Entity> {
  return new Map(
    metaModelEntityList.filter((entry) => entry.section === section).map(({ entity }) => [entity.uuid!, entity]),
  );
}

const versionHistoryEntityDefinitions: ReadonlyMap<string, Entity> = entityDefinitionsOfSection("modelVersion");

/**
 * #232 — entity UUIDs whose instances always belong to `modelVersion`.
 * Checked first in getApplicationSection; independent of application UUID.
 * @public
 */
export const versionHistoryEntityUuids: ReadonlySet<string> = new Set(versionHistoryEntityDefinitions.keys());

/** Bootstrap Entity row for a version-history parent entity (SQL modelVersion lazy table creation). */
export function getVersionHistoryEntityDefinition(entityUuid: string): Entity | undefined {
  return versionHistoryEntityDefinitions.get(entityUuid);
}

// ################################################################################################
/**
 * #647 — sections that a deployment may or may not have. Each one gets its own store when its
 * Deployment configuration declares it; reads of an absent one are empty, writes fail with a named
 * error. modelVersion holds version history (#232), devData holds information about the application
 * that is not needed to deploy or use it.
 */
export const optionalApplicationSections = ["modelVersion", "devData"] as const;
export type OptionalApplicationSection = (typeof optionalApplicationSections)[number];

export function isOptionalApplicationSection(section: string): section is OptionalApplicationSection {
  return (optionalApplicationSections as readonly string[]).includes(section);
}

/** #647 — the fixed Entity rows of the devData section, defined in the Miroir model. */
const devDataEntityDefinitions: ReadonlyMap<string, Entity> = entityDefinitionsOfSection("devData");

/**
 * #647 — entity UUIDs whose instances always belong to `devData`, whatever the application.
 * Checked in getApplicationSection after versionHistoryEntityUuids.
 * @public
 */
export const devDataEntityUuids: ReadonlySet<string> = new Set(devDataEntityDefinitions.keys());

/** Bootstrap Entity row for a devData entity: an application's devData store boots and creates tables from it. */
export function getDevDataEntityDefinition(entityUuid: string): Entity | undefined {
  return devDataEntityDefinitions.get(entityUuid);
}

/** The Entities whose instances always live in an optional section, by section. */
export function optionalSectionEntityUuids(section: OptionalApplicationSection): ReadonlySet<string> {
  return section === "modelVersion" ? versionHistoryEntityUuids : devDataEntityUuids;
}

/** The fixed Entity row of an entity that lives in an optional section (lazy store creation, boot). */
export function getOptionalSectionEntityDefinition(
  section: OptionalApplicationSection,
  entityUuid: string,
): Entity | undefined {
  return section === "modelVersion"
    ? versionHistoryEntityDefinitions.get(entityUuid)
    : devDataEntityDefinitions.get(entityUuid);
}

/** The Entities of every optional section: they are never part of the model or data stores. */
export function isOptionalSectionEntityUuid(entityUuid: string): boolean {
  return versionHistoryEntityUuids.has(entityUuid) || devDataEntityUuids.has(entityUuid);
}

// ################################################################################################
export function getApplicationSection(
  applicationUuid: Uuid,
  entityUuid: Uuid,
): ApplicationSection {
  // #232: version-history entities always live in modelVersion regardless of application
  if (versionHistoryEntityUuids.has(entityUuid)) return "modelVersion";
  // #647: devData entities always live in devData regardless of application
  if (devDataEntityUuids.has(entityUuid)) return "devData";
  if (applicationUuid == selfApplicationMiroir.uuid) {
    return metaMetaModelEntityUuids.includes(entityUuid) ? "model" : "data";
  }
  return metaModelEntityUuids.includes(entityUuid) ? "model" : "data";
}

/**
 * #647: the section a report load reads an Entity's rows from. A devData Entity's rows live in
 * `devData` only (the local cache selectors look for them there too), whatever section the request
 * or the page names; another Entity is read from the requested section, `data` by default.
 */
export function reportLoadSection(entityUuid: Uuid, requestedSection?: ApplicationSection): ApplicationSection {
  return devDataEntityUuids.has(entityUuid) ? "devData" : requestedSection ?? "data";
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
  const devData = {
    availableQueries: metaModel.storedQueries,
    availableReports: metaModel.reports.filter((r: Report) => metaModelDevDataReports.includes(r.uuid)),
    entities: metaModel.entities,
    entityVersions: metaModel.entityVersions,
  };
  if (application === selfApplicationMiroir.uuid) {
    return {
      devData,
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
            !metaModelVersionReports.includes(r.uuid) &&
            !metaModelDevDataReports.includes(r.uuid),
        ),
        entities: metaModel.entities,
        entityVersions: metaModel.entityVersions,
      },
    };
  } else {
    return {
      devData,
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
  ...emptyMetaModelCollections(),
};

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
  MlSchema: "ml-schema",
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

    const collections = await readMetaModelCollections(applicationUuid, (section, entityUuid, collection) =>
      extractEntityInstances(storeController, section, entityUuid, collection),
    );

    log.debug("\n8. Assembling MetaModel structure...");
    const libraryMetaModel: MetaModel = {
      applicationUuid: applicationUuid,
      applicationName: applicationName,
      ...collections,
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
