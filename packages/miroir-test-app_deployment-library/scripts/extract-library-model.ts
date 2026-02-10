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
  miroirCoreStartup,
  type ApplicationDeploymentMap,
  type ApplicationVersion,
  type Deployment,
  type EndpointDefinition,
  type Entity,
  type EntityDefinition,
  type JzodElement,
  type Menu,
  type MetaModel,
  type MlSchema,
  type Query,
  type Report
} from "miroir-core";

import {
  deployment_Admin,
  deployment_Library_DO_NO_USE
} from "miroir-test-app_deployment-admin";

import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Entity UUIDs from Miroir meta-model
const ENTITY_ENTITY_UUID = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";
const ENTITY_DEFINITION_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const ENTITY_MENU_UUID = "dde4c883-ae6d-47c3-b6df-26bc6e3c1842";
const ENTITY_REPORT_UUID = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const ENTITY_ENDPOINT_VERSION_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const ENTITY_JZOD_SCHEMA_UUID = "5e81e1b9-38be-487c-b3e5-53796c57fccf";
const ENTITY_QUERY_VERSION_UUID = "e4320b9e-ab45-4abe-85d8-359604b3c62f";
const ENTITY_SELF_APPLICATION_UUID = "a659d350-dd97-4da9-91de-524fa01745dc";
const ENTITY_SELF_APPLICATION_VERSION_UUID = "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24";
const ENTITY_SELF_APPLICATION_MODEL_BRANCH_UUID = "cdb0aec6-b848-43ac-a058-fe2dbe5811f1";

// Logger setup
const packageName = "miroir-test-app_deployment-library";
const cleanLevel = "info";
let log: LoggerInterface = console as any as LoggerInterface;

/**
 * Extracts the complete MetaModel from a filesystem-deployed Library application.
 * This script mounts the store, reads all model elements dynamically, and outputs a JSON file.
 */
async function extractLibraryModel() {
  try {
    console.log("=".repeat(80));
    console.log("Extracting Library Application MetaModel from Filesystem Store");
    console.log("=".repeat(80));

    // Initialize Miroir framework
    console.log("\n1. Initializing Miroir framework...");
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup();
    miroirIndexedDbStoreSectionStartup();
    miroirPostgresStoreSectionStartup();
    ConfigurationService.registerTestImplementation({ expect: {} as any });

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
    const miroirActivityTracker = new MiroirActivityTracker();
    const miroirEventService = new MiroirEventService(miroirActivityTracker);
    const miroirContext = new MiroirContext(miroirActivityTracker, miroirEventService, miroirConfig);

    // Create persistence store controller manager
    console.log("4. Creating persistence store controller manager...");
    const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
      ConfigurationService.adminStoreFactoryRegister,
      ConfigurationService.StoreSectionFactoryRegister
    );

    // Setup application deployment map
    const applicationDeploymentMap: ApplicationDeploymentMap = {
      ...defaultSelfApplicationDeploymentMap,
      [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
    };

    // Get storage configurations
    const libraryDeploymentStorageConfiguration = miroirConfig.client.deploymentStorageConfig[
      deployment_Library_DO_NO_USE.uuid
    ];

    const adminDeploymentStorageConfiguration =
      miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid];

    const adminDeployment: Deployment = {
      ...deployment_Admin,
      configuration: adminDeploymentStorageConfiguration,
    };

    // Create the library deployment
    console.log("5. Creating library deployment...");
    const createLibraryDeploymentAction = createDeploymentCompositeAction(
      "library",
      deployment_Library_DO_NO_USE.uuid,
      selfApplicationLibrary.uuid,
      adminDeployment,
      libraryDeploymentStorageConfiguration
    );

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

    // Read all model elements from the store
    console.log("\n7. Reading model elements from filesystem store...");

    console.log("   - Reading entities...");
    const entitiesResult = await storeController.getInstances("model", ENTITY_ENTITY_UUID);
    if (entitiesResult instanceof Action2Error) {
      throw new Error(`Error reading entities: ${entitiesResult}`);
    }
    if (entitiesResult.returnedDomainElement instanceof Domain2ElementFailed) {
      throw new Error(`Domain2Element conversion failed for entities: ${entitiesResult.returnedDomainElement}`);
    }

    const entities =
      entitiesResult.status === "ok" ? entitiesResult.returnedDomainElement.instances : [];
    console.log(`     Found ${entities.length} entities`);

    console.log("   - Reading entity definitions...");
    const entityDefinitionsResult = await storeController.getInstances(
      "model",
      ENTITY_DEFINITION_UUID
    );
    if (entityDefinitionsResult instanceof Action2Error) {
      throw new Error(`Error reading entity definitions: ${entityDefinitionsResult}`);
    }
    if (entityDefinitionsResult.returnedDomainElement instanceof Domain2ElementFailed) {
      throw new Error(`Domain2Element conversion failed for entity definitions: ${entityDefinitionsResult.returnedDomainElement}`);
    }
    const entityDefinitions =
      entityDefinitionsResult.status === "ok"
        ? entityDefinitionsResult.returnedDomainElement.instances
        : [];
    console.log(`     Found ${entityDefinitions.length} entity definitions`);

    console.log("   - Reading endpoints...");
    const endpointsResult = await storeController.getInstances("model", ENTITY_ENDPOINT_VERSION_UUID);
    if (endpointsResult instanceof Action2Error) {
      throw new Error(`Error reading endpoints: ${endpointsResult}`);
    }
    if (endpointsResult.returnedDomainElement instanceof Domain2ElementFailed) {
      throw new Error(`Domain2Element conversion failed for endpoints: ${endpointsResult.returnedDomainElement}`);
    }
    const endpoints =
      endpointsResult.status === "ok" ? endpointsResult.returnedDomainElement.instances : [];
    console.log(`     Found ${endpoints.length} endpoints`);

    console.log("   - Reading menus...");
    const menusResult = await storeController.getInstances("model", ENTITY_MENU_UUID);
    if (menusResult instanceof Action2Error) {
      throw new Error(`Error reading menus: ${menusResult}`);
    }
    if (menusResult.returnedDomainElement instanceof Domain2ElementFailed) {
      throw new Error(`Domain2Element conversion failed for menus: ${menusResult.returnedDomainElement}`);
    }
    const menus = menusResult.status === "ok" ? menusResult.returnedDomainElement.instances : [];
    console.log(`     Found ${menus.length} menus`);

    console.log("   - Reading reports...");
    const reportsResult = await storeController.getInstances("model", ENTITY_REPORT_UUID);
    if (reportsResult instanceof Action2Error) {
      throw new Error(`Error reading reports: ${reportsResult}`);
    }
    if (reportsResult.returnedDomainElement instanceof Domain2ElementFailed) {
      throw new Error(`Domain2Element conversion failed for reports: ${reportsResult.returnedDomainElement}`);
    }
    const reports =
      reportsResult.status === "ok" ? reportsResult.returnedDomainElement.instances : [];
    console.log(`     Found ${reports.length} reports`);

    console.log("   - Reading jzod schemas...");
    const jzodSchemasResult = await storeController.getInstances("model", ENTITY_JZOD_SCHEMA_UUID);
    if (jzodSchemasResult instanceof Action2Error) {
      throw new Error(`Error reading jzod schemas: ${JSON.stringify(jzodSchemasResult, null, 2)}`);
    }
    if (jzodSchemasResult.returnedDomainElement instanceof Domain2ElementFailed) {
      throw new Error(`Domain2Element conversion failed for jzod schemas: ${jzodSchemasResult.returnedDomainElement}`);
    }
    const jzodSchemas =
      jzodSchemasResult.status === "ok" ? jzodSchemasResult.returnedDomainElement.instances : [];
    console.log(`     Found ${jzodSchemas.length} jzod schemas`);

    console.log("   - Reading queries...");
    const queriesResult = await storeController.getInstances("model", ENTITY_QUERY_VERSION_UUID);
    if (queriesResult instanceof Action2Error) {
      throw new Error(`Error reading queries: ${queriesResult}`);
    }
    if (queriesResult.returnedDomainElement instanceof Domain2ElementFailed) {
      throw new Error(`Domain2Element conversion failed for queries: ${queriesResult.returnedDomainElement}`);
    }
    const queries =
      queriesResult.status === "ok" ? queriesResult.returnedDomainElement.instances : [];
    console.log(`     Found ${queries.length} queries`);

    console.log("   - Reading application versions...");
    const applicationVersionsResult = await storeController.getInstances(
      "model",
      ENTITY_SELF_APPLICATION_VERSION_UUID
    );
    if (applicationVersionsResult instanceof Action2Error) {
      throw new Error(`Error reading application versions: ${applicationVersionsResult}`);
    }
    if (applicationVersionsResult.returnedDomainElement instanceof Domain2ElementFailed) {
      throw new Error(`Domain2Element conversion failed for application versions: ${applicationVersionsResult.returnedDomainElement}`);
    }
    const applicationVersions =
      applicationVersionsResult.status === "ok"
        ? applicationVersionsResult.returnedDomainElement.instances
        : [];
    console.log(`     Found ${applicationVersions.length} application versions`);

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
    };

    // Write to output file
    console.log("9. Writing MetaModel to file...");
    const outputPath = resolve(__dirname, "..", "dist", "library-metamodel-extracted.json");
    const outputDir = dirname(outputPath);

    await mkdir(outputDir, { recursive: true });
    const jsonContent = JSON.stringify(libraryMetaModel, null, 2);
    await writeFile(outputPath, jsonContent, "utf-8");

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

extractLibraryModel();
