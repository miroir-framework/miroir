import type { MiroirConfigClient } from "miroir-core";
import { deployment_Admin } from "miroir-test-app_deployment-admin";

import type { IntegrationTestTransformerDefaults } from "./integrationTestProfiles.js";

/** Miroir app deployment UUID in test `miroirConfig.test-*.json` fixtures. */
export const MIROIR_TEST_DEPLOYMENT_UUID = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";

type StoreSection = {
  emulatedServerType?: string;
  connectionString?: string;
  schema?: string;
};

type DeploymentStorageEntry = {
  admin?: StoreSection;
  model?: StoreSection;
  data?: StoreSection;
};

export type MiroirConfigForDerivation =
  | MiroirConfigClient
  | { client?: { deploymentStorageConfig?: Record<string, DeploymentStorageEntry> } };

const APP_STORE_TYPES = new Set(["sql", "filesystem", "indexedDb", "mongodb"]);
const ADMIN_STORE_TYPES = new Set(["filesystem", "sql", "indexedDb", "mongodb", "bundled"]);

function getDeploymentStorageConfig(
  config: MiroirConfigForDerivation,
): Record<string, DeploymentStorageEntry> | undefined {
  if (!("client" in config) || !config.client) {
    return undefined;
  }
  if ("deploymentStorageConfig" in config.client) {
    return config.client.deploymentStorageConfig as Record<string, DeploymentStorageEntry>;
  }
  return undefined;
}

function mapAppStoreType(
  emulatedServerType: string | undefined,
): IntegrationTestTransformerDefaults["appStoreType"] | undefined {
  if (!emulatedServerType || !APP_STORE_TYPES.has(emulatedServerType)) {
    return undefined;
  }
  return emulatedServerType as IntegrationTestTransformerDefaults["appStoreType"];
}

function mapAdminStoreType(
  emulatedServerType: string | undefined,
): IntegrationTestTransformerDefaults["adminStoreType"] | undefined {
  if (!emulatedServerType || !ADMIN_STORE_TYPES.has(emulatedServerType)) {
    return undefined;
  }
  return emulatedServerType as IntegrationTestTransformerDefaults["adminStoreType"];
}

export function parsePostgresHostFromConnectionString(
  connectionString: string | undefined,
): string | undefined {
  if (!connectionString) {
    return undefined;
  }
  try {
    const url = new URL(connectionString.replace(/^postgres(?:ql)?:/, "http:"));
    return url.hostname || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Map admin + miroir deployment sections from a test miroirConfig JSON into
 * `MIROIR_TEST_*` transformer session defaults (Gap D2).
 */
export function deriveTestSessionDefaultsFromMiroirConfig(
  config: MiroirConfigForDerivation,
): Partial<IntegrationTestTransformerDefaults> {
  const storage = getDeploymentStorageConfig(config);
  if (!storage) {
    return {};
  }

  const result: Partial<IntegrationTestTransformerDefaults> = {};

  const adminDeployment = storage[deployment_Admin.uuid];
  const adminSection = adminDeployment?.admin;
  if (adminSection) {
    result.adminStoreType = mapAdminStoreType(adminSection.emulatedServerType);
    if (adminSection.emulatedServerType === "sql" && adminSection.schema) {
      result.adminSqlSchema = adminSection.schema;
    }
    const adminHost = parsePostgresHostFromConnectionString(adminSection.connectionString);
    if (adminHost) {
      result.postgresHost = adminHost;
    }
  }

  const miroirDeployment = storage[MIROIR_TEST_DEPLOYMENT_UUID];
  const appSection = miroirDeployment?.model ?? miroirDeployment?.data;
  if (appSection) {
    result.appStoreType = mapAppStoreType(appSection.emulatedServerType);
    const appHost = parsePostgresHostFromConnectionString(appSection.connectionString);
    if (appHost) {
      result.postgresHost = appHost;
    }
  }

  return result;
}
