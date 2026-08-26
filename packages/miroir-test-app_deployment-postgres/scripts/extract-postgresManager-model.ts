import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import {
  ConfigurationService,
  extractApplicationData,
  extractApplicationModel,
  LoggerInterface,
  miroirCoreStartup,
  MiroirLoggerFactory,
  mountApplicationDeployment,
  type Entity,
  type MetaModel,
  type MiroirConfigClient
} from "miroir-core";

// import {
//   deployment_Library_DO_NO_USE
// } from "miroir-test-app_deployment-library";

// import {
//   entityAuthor,
//   entityBook,
//   entityCountry,
//   entityLendingHistoryItem,
//   entityPublisher,
//   entityUser,
//   selfApplicationLibrary,
// } from "miroir-test-app_deployment-library";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { applicationPostgres, deploymentPostgres } from "../src/Postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger setup
const packageName = "miroir-test-app_deployment-library";
const cleanLevel = "info";
let log: LoggerInterface = console as any as LoggerInterface;



console.log("=".repeat(80));
console.log("Extracting Library Application MetaModel from Filesystem Store");
console.log("=".repeat(80));

// Load configuration
const configPath = resolve(__dirname, "extractMetaModelConfig.json");
const configContent = await readFile(configPath, "utf-8");
const miroirConfig: MiroirConfigClient = JSON.parse(configContent);

if (!miroirConfig || !miroirConfig.client || !miroirConfig.client.emulateServer) {
  throw new Error("Invalid configuration: 'client.emulateServer' must be defined in extractMetaModelConfig.json");
}


// ##############################################################################################
export async function extractApplicationAndData(
  miroirConfig: MiroirConfigClient,
  applicationUuid: string,
  applicationName: string,
  deploymentUuid: string,
  modelOutputPath: string,
  dataOutputPath: string,
  entitiesToExtract: Entity[],
) {
  try {

        if (!miroirConfig || !miroirConfig.client || !miroirConfig.client.emulateServer) {
      throw new Error("Invalid configuration: 'client.emulateServer' must be defined in extractMetaModelConfig.json");
    }

    // Initialize Miroir framework
    console.log("\n1. Initializing Miroir framework...");
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
    miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
    miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
    ConfigurationService.configurationService.registerTestImplementation({ expect: {} as any });

    const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "extract-application-model-and-data");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
      log = logger;
    });

    // Resolve relative paths to absolute paths using the scripts directory as base
    const scriptsDir = __dirname;
    const appDeploymentConfig = miroirConfig.client.deploymentStorageConfig[deploymentUuid];
    
    if (appDeploymentConfig.model.emulatedServerType !== "filesystem") {
      throw new Error("Invalid configuration: The deployment storage config for the library must have 'emulatedServerType' set to 'filesystem'");
    }
    if (appDeploymentConfig.data.emulatedServerType !== "filesystem") {
      throw new Error("Invalid configuration: The deployment storage config for the library must have 'emulatedServerType' set to 'filesystem'");
    }
    if (appDeploymentConfig.admin.emulatedServerType !== "filesystem") {
      throw new Error("Invalid configuration: The deployment storage config for the library must have 'emulatedServerType' set to 'filesystem'");
    }
    // Paths in extractMetaModelConfig.json are relative to the package root (cwd when
    // running via npm -w), joined with client.filesystemDeploymentRootDirectory — same as library.
    console.log("   Configuration loaded successfully");
    console.log("   Scripts directory:", scriptsDir);
    console.log("   Model directory:", appDeploymentConfig.model.directory);
    console.log("   Data directory:", appDeploymentConfig.data.directory);
    console.log("   Admin directory:", appDeploymentConfig.admin.directory);
    console.log("   filesystemDeploymentRootDirectory:", miroirConfig.client.filesystemDeploymentRootDirectory);


    const { storeController, persistenceStoreControllerManager } = await mountApplicationDeployment(
      miroirConfig,
      deploymentUuid,
    );

    const libraryMetaModel: MetaModel = await extractApplicationModel(
      storeController,
      applicationUuid,
      applicationName
    );

    // Write to output file
    const outputDir = dirname(modelOutputPath);

    await mkdir(outputDir, { recursive: true });
    const jsonContent = JSON.stringify(libraryMetaModel, null, 2);
    await writeFile(modelOutputPath, jsonContent, "utf-8");

    const libraryData = await extractApplicationData(storeController, applicationUuid, entitiesToExtract);
    const dataJsonContent = JSON.stringify(libraryData, null, 2);
    await writeFile(dataOutputPath, dataJsonContent, "utf-8");

    // Close the store
    await persistenceStoreControllerManager.deletePersistenceStoreController(
      deploymentUuid
    );

    // Print summary
    console.log("\n" + "=".repeat(80));
    console.log("✓ Application Model and Data successfully extracted");
    console.log("=".repeat(80));
    console.log(`Model Output file: ${modelOutputPath}`);
    console.log(`Data Output file: ${dataOutputPath}`);
    console.log(`Application UUID: ${libraryMetaModel.applicationUuid}`);
    console.log(`Application Name: ${libraryMetaModel.applicationName}`);
    console.log(`  - Entities: ${libraryMetaModel.entities.length}`);
    console.log(`  - Entity Definitions: ${libraryMetaModel.entityVersions.length}`);
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
    console.error("Error extracting Application Model and Data:");
    console.error("!".repeat(80));
    console.error(error);
    console.error("!".repeat(80));
    process.exit(1);
  }
}

// ################################################################################################
extractApplicationAndData(
  miroirConfig,
  applicationPostgres.uuid,
  applicationPostgres.name,
  deploymentPostgres.uuid,
  resolve(__dirname, "..", "dist", "postgresManager-model.json"),
  resolve(__dirname, "..", "dist", "postgresManager-data.json"),
  [
  ],
);

// export { extractEntityInstances };
