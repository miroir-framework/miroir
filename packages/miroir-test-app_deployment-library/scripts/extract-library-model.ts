import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import {
  ConfigurationService,
  LoggerInterface,
  MiroirConfigClient,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  miroirCoreStartup,
  type DataSet,
  type Entity,
  type MetaModel,
  type PersistenceStoreControllerInterface
} from "miroir-core";

import {
  deployment_Library_DO_NO_USE
} from "miroir-test-app_deployment-library";

import {
  entityAuthor,
  entityBook,
  entityCountry,
  entityLendingHistoryItem,
  entityPublisher,
  entityUser,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { extractApplicationModel, extractEntityInstances } from "./extract-application-model-and-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger setup
const packageName = "miroir-test-app_deployment-library";
const cleanLevel = "info";
let log: LoggerInterface = console as any as LoggerInterface;


// ##############################################################################################
async function mountLibraryDeployment(
  miroirConfig: MiroirConfigClient
) {
  try {
    // // Load configuration
    // console.log("2. Loading configuration from extractMetaModelConfig.json...");
    // const configPath = resolve(__dirname, "extractMetaModelConfig.json");
    // const configContent = await readFile(configPath, "utf-8");
    // const miroirConfig: MiroirConfigClient = JSON.parse(configContent);
    
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

    // Get storage configurations
    const libraryDeploymentStorageConfiguration = miroirConfig.client.deploymentStorageConfig[
      deployment_Library_DO_NO_USE.uuid
    ];

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


// ##############################################################################################
async function extractLibraryData(
  storeController: PersistenceStoreControllerInterface,
  entities: Entity[],
): Promise<DataSet> {
  try {
    console.log("\nExtracting data sets from filesystem store...");
    // const authors = await extractEntityInstances(storeController, "data", entityAuthor.uuid, "authors");
    // const books = await extractEntityInstances(storeController, "data", entityBook.uuid, "books");
    // const countries = await extractEntityInstances(storeController, "data", entityCountry.uuid, "countries");
    // const publishers = await extractEntityInstances(storeController, "data", entityPublisher.uuid, "publishers");
    // const users = await extractEntityInstances(storeController, "data", entityUser.uuid, "users");
    // const lendingHistoryItems = await extractEntityInstances(storeController, "data", entityLendingHistoryItem.uuid, "lending history items");

    const instances = await Promise.all(entities.map(entity => 
      extractEntityInstances(storeController, "data", entity.uuid, entity.name)
    ));

    return Promise.resolve({
      applicationUuid: selfApplicationLibrary.uuid,
      instances: instances.flat() // Flatten the array of arrays into a single array of instances
      // instances: [
      //   // order matters here for referential integrity when re-importing the data
      //   ...countries,
      //   ...publishers,
      //   ...users,
      //   ...authors,
      //   ...books,
      //   ...lendingHistoryItems,
      // ]
    });
  } catch (error) {
    console.error("Error extracting data sets:");
    throw error;
  }
}

// ##############################################################################################
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

    // Load configuration
    console.log("2. Loading configuration from extractMetaModelConfig.json...");
    const configPath = resolve(__dirname, "extractMetaModelConfig.json");
    const configContent = await readFile(configPath, "utf-8");
    const miroirConfig: MiroirConfigClient = JSON.parse(configContent);
    
    if (!miroirConfig || !miroirConfig.client || !miroirConfig.client.emulateServer) {
      throw new Error("Invalid configuration: 'client.emulateServer' must be defined in extractMetaModelConfig.json");
    }
    
    const { storeController, persistenceStoreControllerManager } = await mountLibraryDeployment(miroirConfig);

    const libraryMetaModel: MetaModel = await extractApplicationModel(
      storeController,
      selfApplicationLibrary.uuid,
      selfApplicationLibrary.name
      // persistenceStoreControllerManager,
    );

    // Write to output file
    console.log("9. Writing MetaModel to file...");
    const outputPath = resolve(__dirname, "..", "dist", "library-model-26.01.json");
    const outputDir = dirname(outputPath);

    await mkdir(outputDir, { recursive: true });
    const jsonContent = JSON.stringify(libraryMetaModel, null, 2);
    await writeFile(outputPath, jsonContent, "utf-8");

    // const libraryData = await extractLibraryData(storeController, libraryMetaModel.entities);
    const libraryData = await extractLibraryData(storeController, [
      entityCountry as Entity,
      entityPublisher as Entity,
      entityUser as Entity,
      entityAuthor as Entity,
      entityBook as Entity,
      entityLendingHistoryItem as Entity,
    ]);
    const dataOutputPath = resolve(__dirname, "..", "dist", "library-data-26.01.json");
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
    console.log(`  - Themes: ${libraryMetaModel.themes.length}`);
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
