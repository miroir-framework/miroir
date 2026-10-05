import { ConfigurationService, type MiroirConfigClient, type StoreUnitConfiguration } from "miroir-core";

const packageName = "miroir-mcp";

/**
 * The store types of every deployment a client configuration opens: the emulated server's stores, or
 * those a real-server client names.
 */
export function requiredStoreTypes(config: MiroirConfigClient): Set<string> {
  const deployments: Record<string, StoreUnitConfiguration> = config.client.emulateServer
    ? config.client.deploymentStorageConfig
    : (config.client.serverConfig.storeSectionConfiguration ?? {});
  const storeTypes = new Set<string>();
  for (const storeUnitConfig of Object.values(deployments)) {
    for (const section of Object.values(storeUnitConfig) as { emulatedServerType?: string }[]) {
      if (section?.emulatedServerType) {
        storeTypes.add(section.emulatedServerType);
      }
    }
  }
  return storeTypes;
}

/**
 * Registers the store implementations a client configuration needs: only those packages are
 * imported, so the optional store peer dependencies stay optional.
 */
export async function initializeStoreStartup(config: MiroirConfigClient): Promise<void> {
  const storeTypes = requiredStoreTypes(config);
  console.log(`[${packageName}] Detected storage types in configuration:`, Array.from(storeTypes));
  await Promise.all([...storeTypes].map(initializeStore));
}

type StoreStartup = (configurationService: typeof ConfigurationService.configurationService) => void;

// dynamic imports: a store package is loaded only when a deployment uses it
const storeStartups: Record<string, { storePackage: string; load: () => Promise<StoreStartup> }> = {
  filesystem: {
    storePackage: "miroir-store-filesystem",
    load: async () => (await import("miroir-store-filesystem")).miroirFileSystemStoreSectionStartup,
  },
  indexedDb: {
    storePackage: "miroir-store-indexedDb",
    load: async () => (await import("miroir-store-indexedDb")).miroirIndexedDbStoreSectionStartup,
  },
  sql: {
    storePackage: "miroir-store-postgres",
    load: async () => (await import("miroir-store-postgres")).miroirPostgresStoreSectionStartup,
  },
};

async function initializeStore(storeType: string): Promise<void> {
  const storeStartup = storeStartups[storeType];
  if (!storeStartup) {
    console.warn(`[${packageName}] Unknown storage type: ${storeType} - skipping initialization`);
    return;
  }
  try {
    (await storeStartup.load())(ConfigurationService.configurationService);
  } catch (error) {
    throw new Error(
      `${storeType} storage is required but ${storeStartup.storePackage} is not available. ` +
        `Is it installed? Error: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}
