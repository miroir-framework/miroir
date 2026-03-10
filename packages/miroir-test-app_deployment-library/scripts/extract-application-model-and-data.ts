import { dirname } from "path";
import { fileURLToPath } from "url";

import {
  Action2Error,
  Domain2ElementFailed,
  LoggerInterface,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityMenu,
  entityQueryVersion,
  entityReport,
  entityRunner,
  entitySelfApplicationVersion,
  type ApplicationSection,
  type ApplicationVersion,
  type EndpointDefinition,
  type Entity,
  type EntityDefinition,
  type Menu,
  type MetaModel,
  type MlSchema,
  type PersistenceStoreControllerInterface,
  type Query,
  type Report,
  type Runner,
  type StoredMiroirTheme,
  type Uuid
} from "miroir-core";



import { entityTheme } from "miroir-test-app_deployment-miroir";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logger setup
const packageName = "miroir-test-app_deployment-library";
const cleanLevel = "info";
let log: LoggerInterface = console as any as LoggerInterface;


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
    const applicationVersions = await extractEntityInstances(storeController, "model", entitySelfApplicationVersion.uuid, "application versions");
    const runners = await extractEntityInstances(storeController, "model", entityRunner.uuid, "runners");
    const themes = await extractEntityInstances(storeController, "model", entityTheme.uuid, "themes");

    // Assemble the MetaModel
    console.log("\n8. Assembling MetaModel structure...");
    const libraryMetaModel: MetaModel = {
      applicationUuid: applicationUuid,
      applicationName: applicationName,
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
