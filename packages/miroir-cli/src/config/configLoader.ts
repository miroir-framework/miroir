import { readFileSync } from "fs";
import { resolve } from "path";
import { MiroirCliConfig, MiroirCliConfigSchema } from "./configSchema.js";
import defaultConfigJson from "./defaultConfig.json" with { type: "json" };

const packageName = "miroir-cli";

/**
 * Load and validate MiroirCLI configuration
 * Priority: 
 * 1. MIROIR_CLI_CONFIG_PATH environment variable
 * 2. Default embedded configuration
 */
export function loadMiroirCliConfig(): MiroirCliConfig {
  const configPath = process.env.MIROIR_CLI_CONFIG_PATH;
  
  let configData: unknown;
  
  if (configPath) {
    try {
      const absolutePath = resolve(configPath);
      const fileContent = readFileSync(absolutePath, "utf-8");
      configData = JSON.parse(fileContent);
      console.log(`[${packageName}] Loaded configuration from: ${absolutePath}`);
    } catch (error) {
      console.error(`[${packageName}] Failed to load config from ${configPath}:`, error);
      throw new Error(
        `Failed to load MiroirCLI configuration from ${configPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  } else {
    configData = defaultConfigJson;
    console.log(`[${packageName}] Using default embedded configuration`);
  }

  // Validate configuration
  try {
    const validated = MiroirCliConfigSchema.parse(configData);
    return validated;
  } catch (error) {
    console.error(`[${packageName}] Configuration validation failed:`, error);
    throw new Error(
      `Invalid MiroirCLI configuration: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get detected storage types from configuration
 * Used to conditionally load store packages
 */
export function getRequiredStorageTypes(config: MiroirCliConfig): Set<string> {
  const storageTypes = new Set<string>();
  
  for (const storeUnitConfig of Object.values(config.client.deploymentStorageConfig)) {
    storageTypes.add(storeUnitConfig.admin.emulatedServerType);
    storageTypes.add(storeUnitConfig.model.emulatedServerType);
    storageTypes.add(storeUnitConfig.data.emulatedServerType);
  }
  
  return storageTypes;
}
