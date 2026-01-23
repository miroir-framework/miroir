import { MiroirMcpConfig } from "../config/configSchema.js";
import { getRequiredStorageTypes } from "../config/configLoader.js";

const packageName = "miroir-mcp";

/**
 * Conditionally initialize store backend support based on configuration
 * Dynamically imports and calls startup functions only for detected storage types
 */
export async function initializeStoreStartup(config: MiroirMcpConfig): Promise<void> {
  const requiredStorageTypes = getRequiredStorageTypes(config);
  
  console.log(
    `[${packageName}] Detected storage types in configuration:`,
    Array.from(requiredStorageTypes)
  );

  // Initialize each required storage backend
  const initPromises: Promise<void>[] = [];
  
  for (const storageType of requiredStorageTypes) {
    switch (storageType) {
      case "filesystem":
        initPromises.push(initializeFilesystemStore());
        break;
      case "indexedDb":
        initPromises.push(initializeIndexedDbStore());
        break;
      case "sql":
        initPromises.push(initializeSqlStore());
        break;
      default:
        console.warn(
          `[${packageName}] Unknown storage type: ${storageType} - skipping initialization`
        );
    }
  }
  
  await Promise.all(initPromises);
}

/**
 * Initialize filesystem store support
 */
async function initializeFilesystemStore(): Promise<void> {
  try {
    // Dynamic import to avoid bundling if not needed
    const module = await import("miroir-store-filesystem");
    module.miroirFileSystemStoreSectionStartup();
    console.log(`[${packageName}] Filesystem store initialized`);
  } catch (error) {
    throw new Error(
      `Filesystem storage is required but miroir-store-filesystem package is not available. ` +
        `Is it installed? Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Initialize IndexedDB store support
 */
async function initializeIndexedDbStore(): Promise<void> {
  try {
    const module = await import("miroir-store-indexedDb");
    module.miroirIndexedDbStoreSectionStartup();
    console.log(`[${packageName}] IndexedDB store initialized`);
  } catch (error) {
    throw new Error(
      `IndexedDB storage is required but miroir-store-indexedDb package is not available. ` +
        `Is it installed? Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Initialize SQL (PostgreSQL) store support
 */
async function initializeSqlStore(): Promise<void> {
  try {
    const module = await import("miroir-store-postgres");
    module.miroirPostgresStoreSectionStartup();
    console.log(`[${packageName}] PostgreSQL store initialized`);
  } catch (error) {
    throw new Error(
      `SQL storage is required but miroir-store-postgres package is not available. ` +
        `Is it installed? Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
