import { writeFile, mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import {defaultLibraryAppModel} from "../src/Library.js";
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


    const outputPath = resolve(__dirname, "..", "dist", "library-metamodel.json");
    const outputDir = dirname(outputPath);
    
    // Ensure the dist directory exists
    await mkdir(outputDir, { recursive: true });
    
    const jsonContent = JSON.stringify(defaultLibraryAppModel, null, 2);

    await writeFile(outputPath, jsonContent, "utf-8");

    console.log(`✓ Library MetaModel successfully generated at: ${outputPath}`);
    console.log("uuid:", defaultLibraryAppModel.applicationUuid);
    console.log("name:", defaultLibraryAppModel.applicationName);
    console.log(`  - Entities: ${defaultLibraryAppModel.entities.length}`);
    console.log(`  - Entity Definitions: ${defaultLibraryAppModel.entityDefinitions.length}`);
    console.log(`  - Endpoints: ${defaultLibraryAppModel.endpoints.length}`);
    console.log(`  - Menus: ${defaultLibraryAppModel.menus.length}`);
    console.log(`  - Reports: ${defaultLibraryAppModel.reports.length}`);
  } catch (error) {
    console.error("Error generating Library MetaModel:", error);
    process.exit(1);
  }
}

generateLibraryMetaModel();
