import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Import all library model elements
import {
  // Entities
  entityAuthor,
  entityBook,
  entityCountry,
  entityLendingHistoryItem,
  entityPublisher,
  entityUser,
  // Entity Definitions
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionCountry,
  entityDefinitionLendingHistoryItem,
  entityDefinitionPublisher,
  entityDefinitionUser,
  // Endpoints
  bookEndpoint,
  lendingEndpoint,
  // Menus
  menuDefaultLibrary,
  // Reports
  reportAuthorDetails,
  reportAuthorList,
  reportBookDetails,
  reportBookList,
  reportCountryList,
  reportPublisherList,
  // Application metadata
  selfApplicationVersionLibraryInitialVersion,
  selfApplicationLibrary,
  reportUserList,
  reportUserDetails,
  reportLendingHistoryItemDetails,
  reportLendingHistoryItemList,
  reportLibraryHome,
  reportCountryDetails,
  reportPublisherDetails,
} from "../index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates a JSON file containing the complete MetaModel for the Library application.
 * The MetaModel includes entities, entity definitions, endpoints, menus, reports,
 * stored queries, jzod schemas, and application version cross references.
 */
async function generateLibraryMetaModel() {
  try {
    console.log("Generating Library application MetaModel...");

    const libraryMetaModel /*: MetaModel */ = {
      applicationUuid: selfApplicationLibrary.uuid,
      applicationName: selfApplicationLibrary.name,
      entities: [
        entityAuthor,
        entityBook,
        entityCountry,
        entityLendingHistoryItem,
        entityPublisher,
        entityUser,
      ],
      entityDefinitions: [
        entityDefinitionAuthor,
        entityDefinitionBook,
        entityDefinitionCountry,
        entityDefinitionLendingHistoryItem,
        entityDefinitionPublisher,
        entityDefinitionUser,
      ],
      endpoints: [
        bookEndpoint,
        lendingEndpoint,
      ],
      menus: [
        menuDefaultLibrary,
      ],
      reports: [
        reportAuthorDetails,
        reportAuthorList,
        reportBookDetails,
        reportBookList,
        reportCountryDetails,
        reportCountryList,
        reportPublisherDetails,
        reportPublisherList,
        reportUserDetails,
        reportUserList,
        reportLendingHistoryItemDetails,
        reportLendingHistoryItemList,
        reportLibraryHome,
      ],
      storedQueries: [],
      jzodSchemas: [],
      applicationVersions: [
        selfApplicationVersionLibraryInitialVersion,
      ],
      applicationVersionCrossEntityDefinition: [],
    };

    const outputPath = resolve(__dirname, "..", "dist", "library-metamodel.json");
    const outputDir = dirname(outputPath);
    
    // Ensure the dist directory exists
    await mkdir(outputDir, { recursive: true });
    
    const jsonContent = JSON.stringify(libraryMetaModel, null, 2);

    await writeFile(outputPath, jsonContent, "utf-8");

    console.log(`✓ Library MetaModel successfully generated at: ${outputPath}`);
    console.log("uuid:", libraryMetaModel.applicationUuid);
    console.log("name:", libraryMetaModel.applicationName);
    console.log(`  - Entities: ${libraryMetaModel.entities.length}`);
    console.log(`  - Entity Definitions: ${libraryMetaModel.entityDefinitions.length}`);
    console.log(`  - Endpoints: ${libraryMetaModel.endpoints.length}`);
    console.log(`  - Menus: ${libraryMetaModel.menus.length}`);
    console.log(`  - Reports: ${libraryMetaModel.reports.length}`);
  } catch (error) {
    console.error("Error generating Library MetaModel:", error);
    process.exit(1);
  }
}

generateLibraryMetaModel();
