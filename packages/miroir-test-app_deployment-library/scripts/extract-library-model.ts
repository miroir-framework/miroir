import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import {
  Action2Error,
  ConfigurationService,
  Domain2ElementFailed,
  LoggerInterface,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirContext,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  createDeploymentCompositeAction,
  defaultSelfApplicationDeploymentMap,
  entityDefinition,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplicationVersion,
  miroirCoreStartup,
  type ApplicationDeploymentMap,
  type ApplicationSection,
  type ApplicationVersion,
  type DataSet,
  type Deployment,
  type EndpointDefinition,
  type Entity,
  type EntityDefinition,
  type JzodElement,
  type Menu,
  type MetaModel,
  type MlSchema,
  type PersistenceStoreController,
  type PersistenceStoreControllerInterface,
  type Query,
  type Report,
  type Runner
} from "miroir-core";

import {
  deployment_Admin,
} from "miroir-test-app_deployment-admin";
import {
  deployment_Library_DO_NO_USE
} from "miroir-test-app_deployment-library";

import { entityAuthor, entityBook, entityCountry, entityLendingHistoryItem, entityPublisher, entityUser, selfApplicationLibrary } from "miroir-test-app_deployment-library";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Entity UUIDs from Miroir meta-model
// const ENTITY_ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITY_ENTITY_UUID = entityEntity.uuid;
const ENTITY_DEFINITION_UUID = entityEntityDefinition.uuid;
const ENTITY_MENU_UUID = entityMenu.uuid;
const ENTITY_REPORT_UUID = entityReport.uuid;
const ENTITY_ENDPOINT_VERSION_UUID = entityEndpointVersion.uuid;
const ENTITY_JZOD_SCHEMA_UUID = entityJzodSchema.uuid;
const ENTITY_QUERY_VERSION_UUID = entityQueryVersion.uuid;
// const ENTITY_SELF_APPLICATION_UUID = "a659d350-dd97-4da9-91de-524fa01745dc";
const ENTITY_SELF_APPLICATION_VERSION_UUID = entitySelfApplicationVersion.uuid;
// const ENTITY_SELF_APPLICATION_MODEL_BRANCH_UUID = "cdb0aec6-b848-43ac-a058-fe2dbe5811f1";

// Logger setup
const packageName = "miroir-test-app_deployment-library";
const cleanLevel = "info";
let log: LoggerInterface = console as any as LoggerInterface;


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

async function mountLibraryDeployment() {
  try {
    // Load configuration
    console.log("2. Loading configuration from extractMetaModelConfig.json...");
    const configPath = resolve(__dirname, "extractMetaModelConfig.json");
    const configContent = await readFile(configPath, "utf-8");
    const miroirConfig: MiroirConfigClient = JSON.parse(configContent);
    
    if (!miroirConfig || !miroirConfig.client || !miroirConfig.client.emulateServer) {
      throw new Error("Invalid configuration: 'client.emulateServer' must be defined in extractMetaModelConfig.json");
    }

    // Resolve relative paths to absolute paths using the scripts directory as base
    const scriptsDir = __dirname;
    const libraryDeploymentConfig = miroirConfig.client.deploymentStorageConfig[deployment_Library_DO_NO_USE.uuid];
    
    if (libraryDeploymentConfig.model.emulatedServerType !== "filesystem") {
      throw new Error("Invalid configuration: The deployment storage config for the library must have 'emulatedServerType' set to 'filesystem'");
    }
    if (libraryDeploymentConfig.data.emulatedServerType !== "filesystem") {
      throw new Error("Invalid configuration: The deployment storage config for the library must have 'emulatedServerType' set to 'filesystem'");
    }
    if (libraryDeploymentConfig.admin.emulatedServerType !== "filesystem") {
      throw new Error("Invalid configuration: The deployment storage config for the library must have 'emulatedServerType' set to 'filesystem'");
    }
    // Convert relative paths to absolute, resolving from scripts directory
    const modelDir = resolve(scriptsDir, libraryDeploymentConfig.model.directory);
    const dataDir = resolve(scriptsDir, libraryDeploymentConfig.data.directory);
    const adminDir = resolve(scriptsDir, libraryDeploymentConfig.admin.directory);
    
    // Update the config with absolute paths
    libraryDeploymentConfig.model.directory = modelDir;
    libraryDeploymentConfig.data.directory = dataDir;
    libraryDeploymentConfig.admin.directory = adminDir;
    
    console.log("   Configuration loaded successfully");
    console.log("   Scripts directory:", scriptsDir);
    console.log("   Model directory:", modelDir);
    console.log("   Data directory:", dataDir);

    // Setup Miroir context and activity tracking
    console.log("3. Setting up Miroir context...");
    // const miroirActivityTracker = new MiroirActivityTracker();
    // const miroirEventService = new MiroirEventService(miroirActivityTracker);
    // const miroirContext = new MiroirContext(miroirActivityTracker, miroirEventService, miroirConfig);

    // Create persistence store controller manager
    console.log("4. Creating persistence store controller manager...");
    const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister
    );

    // // Setup application deployment map
    // const applicationDeploymentMap: ApplicationDeploymentMap = {
    //   ...defaultSelfApplicationDeploymentMap,
    //   [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
    // };

    // Get storage configurations
    const libraryDeploymentStorageConfiguration = miroirConfig.client.deploymentStorageConfig[
      deployment_Library_DO_NO_USE.uuid
    ];

    // const adminDeploymentStorageConfiguration =
    //   miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid];

    // const adminDeployment: Deployment = {
    //   ...deployment_Admin,
    //   configuration: adminDeploymentStorageConfiguration,
    // };

    // // Create the library deployment
    // console.log("5. Creating library deployment...");
    // const createLibraryDeploymentAction = createDeploymentCompositeAction(
    //   "library",
    //   deployment_Library_DO_NO_USE.uuid,
    //   selfApplicationLibrary.uuid,
    //   adminDeployment,
    //   libraryDeploymentStorageConfiguration
    // );

    // We need a domain controller to execute the deployment creation
    // For this, we'll use the setupMiroirDomainController pattern from tests
    // Since we're in emulated server mode, we need to create both client and server controllers
    
    console.log("6. Mounting filesystem stores...");
    // Get the persistence store controller for the library deployment
    let storeController = persistenceStoreControllerManager.getPersistenceStoreController(
      deployment_Library_DO_NO_USE.uuid
    );

    if (!storeController) {
      // Need to add the deployment first
      await persistenceStoreControllerManager.addPersistenceStoreController(
        deployment_Library_DO_NO_USE.uuid,
        libraryDeploymentStorageConfiguration
      );
      
      storeController = persistenceStoreControllerManager.getPersistenceStoreController(
        deployment_Library_DO_NO_USE.uuid
      );
    }

    if (!storeController) {
      throw new Error("Failed to get persistence store controller after adding");
    }

    console.log("   Store mounted successfully");

    return { storeController, persistenceStoreControllerManager };
  } catch (error) {
    console.error("\n" + "!".repeat(80));
    console.error("Error during library deployment mounting:");
    console.error("!".repeat(80));
    console.error(error);
    console.error("!".repeat(80));
    throw error; // Rethrow to be caught by the main function
  }
}
/**
 * Extracts the complete MetaModel from a filesystem-deployed Library application.
 * This script mounts the store, reads all model elements dynamically, and outputs a JSON file.
 */
async function extractLibraryModel(
  storeController: PersistenceStoreControllerInterface,
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
    const applicationVersions = await extractEntityInstances(storeController, "model", entitySelfApplicationVersion.uuid, "application versions");
    const runners = await extractEntityInstances(storeController, "model", entityRunner.uuid, "runners");

    // Assemble the MetaModel
    console.log("\n8. Assembling MetaModel structure...");
    const libraryMetaModel: MetaModel = {
      applicationUuid: selfApplicationLibrary.uuid,
      applicationName: selfApplicationLibrary.name,
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
    };

    return libraryMetaModel;
  } catch (error) {
    console.error("Error extracting Library MetaModel:");
    throw error;
  }
}

async function extractLibraryData(
  storeController: PersistenceStoreControllerInterface,
): Promise<DataSet> {
  try {
    console.log("\nExtracting data sets from filesystem store...");
    const authors = await extractEntityInstances(storeController, "data", entityAuthor.uuid, "authors");
    const books = await extractEntityInstances(storeController, "data", entityBook.uuid, "books");
    const countries = await extractEntityInstances(storeController, "data", entityCountry.uuid, "countries");
    const publishers = await extractEntityInstances(storeController, "data", entityPublisher.uuid, "publishers");
    const users = await extractEntityInstances(storeController, "data", entityUser.uuid, "users");
    const lendingHistoryItems = await extractEntityInstances(storeController, "data", entityLendingHistoryItem.uuid, "lending history items");

    return Promise.resolve({
      applicationUuid: selfApplicationLibrary.uuid,
      instances: [
        // order matters here for referential integrity when re-importing the data
        {
          parentUuid: entityCountry.uuid,
          applicationSection: "data",
          parentName: "Country",
          instances: countries,
        },
        {
          parentUuid: entityPublisher.uuid,
          applicationSection: "data",
          parentName: "Publisher",
          instances: publishers,
        },
        {
          parentUuid: entityUser.uuid,
          applicationSection: "data",
          parentName: "User",
          instances: users,
        },
        {
          parentUuid: entityAuthor.uuid,
          applicationSection: "data",
          parentName: "Author",
          instances: authors,
        },
        {
          parentUuid: entityBook.uuid,
          applicationSection: "data",
          parentName: "Book",
          instances: books,
        },
        {
          parentUuid: entityLendingHistoryItem.uuid,
          applicationSection: "data",
          parentName: "LendingHistoryItem",
          instances: lendingHistoryItems,
        },
      ]
    });
  } catch (error) {
    console.error("Error extracting data sets:");
    throw error;
  }
}

async function extractLibrary() {
  try {
    console.log("=".repeat(80));
    console.log("Extracting Library Application MetaModel from Filesystem Store");
    console.log("=".repeat(80));

    // Initialize Miroir framework
    console.log("\n1. Initializing Miroir framework...");
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
    miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
    miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
    ConfigurationService.configurationService.registerTestImplementation({ expect: {} as any });

    MiroirLoggerFactory.registerLoggerToStart(
      MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "extract-library-metamodel")
    ).then((logger: LoggerInterface) => {
      log = logger;
    });

    const { storeController, persistenceStoreControllerManager } = await mountLibraryDeployment();

    const libraryMetaModel: MetaModel = await extractLibraryModel(
      storeController,
      // persistenceStoreControllerManager,
    );

    // Write to output file
    console.log("9. Writing MetaModel to file...");
    const outputPath = resolve(__dirname, "..", "dist", "library-model-extracted.json");
    const outputDir = dirname(outputPath);

    await mkdir(outputDir, { recursive: true });
    const jsonContent = JSON.stringify(libraryMetaModel, null, 2);
    await writeFile(outputPath, jsonContent, "utf-8");

    const libraryData = await extractLibraryData(storeController);
    const dataOutputPath = resolve(__dirname, "..", "dist", "library-data-extracted.json");
    const dataJsonContent = JSON.stringify(libraryData, null, 2);
    await writeFile(dataOutputPath, dataJsonContent, "utf-8");

    // Close the store
    console.log("10. Cleaning up...");
    await persistenceStoreControllerManager.deletePersistenceStoreController(
      deployment_Library_DO_NO_USE.uuid
    );

    // Print summary
    console.log("\n" + "=".repeat(80));
    console.log("✓ Library MetaModel successfully extracted");
    console.log("=".repeat(80));
    console.log(`Output file: ${outputPath}`);
    console.log(`Application UUID: ${libraryMetaModel.applicationUuid}`);
    console.log(`Application Name: ${libraryMetaModel.applicationName}`);
    console.log(`  - Entities: ${libraryMetaModel.entities.length}`);
    console.log(`  - Entity Definitions: ${libraryMetaModel.entityDefinitions.length}`);
    console.log(`  - Endpoints: ${libraryMetaModel.endpoints.length}`);
    console.log(`  - Menus: ${libraryMetaModel.menus.length}`);
    console.log(`  - Reports: ${libraryMetaModel.reports.length}`);
    console.log(`  - Runners: ${libraryMetaModel.runners.length}`);
    console.log(`  - Jzod Schemas: ${libraryMetaModel.jzodSchemas.length}`);
    console.log(`  - Stored Queries: ${libraryMetaModel.storedQueries.length}`);
    console.log(`  - Application Versions: ${libraryMetaModel.applicationVersions.length}`);
    console.log("=".repeat(80));
    process.exit(0);
  } catch (error) {
    console.error("\n" + "!".repeat(80));
    console.error("Error extracting Library MetaModel:");
    console.error("!".repeat(80));
    console.error(error);
    console.error("!".repeat(80));
    process.exit(1);
  }
}

extractLibrary();

// export { extractEntityInstances };
