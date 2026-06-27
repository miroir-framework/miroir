/**
 * Gap D — unified integration test profiles (standalone-app).
 * Paths are relative to the repository root (joined with process.env.PWD in loadTestConfigFiles).
 */

export type IntegrationTestTransformerDefaults = {
  appStoreType?: "sql" | "filesystem" | "indexedDb" | "mongodb";
  adminStoreType?: "filesystem" | "sql" | "indexedDb" | "mongodb" | "bundled";
  postgresHost?: string;
  adminSqlSchema?: string;
};

export type IntegrationTestProfile = {
  name: string;
  miroirConfigFilename: string;
  logConfigFilename: string;
  transformerDefaults?: IntegrationTestTransformerDefaults;
  description?: string;
};

export type ApplyIntegrationTestProfileOptions = {
  /** When true (default), do not overwrite env vars already set — G5 */
  respectExistingEnv?: boolean;
};

const TESTS = "./packages/miroir-standalone-app/tests";

function configPath(filename: string): string {
  return `${TESTS}/${filename}`;
}

function logPath(filename: string): string {
  return `${TESTS}/${filename}`;
}

export const INTEGRATION_TEST_PROFILES: Record<string, IntegrationTestProfile> = {
  "emulatedServer-sql": {
    name: "emulatedServer-sql",
    miroirConfigFilename: configPath("miroirConfig.test-emulatedServer-sql.json"),
    logConfigFilename: logPath("specificLoggersConfig_DomainController_debug.json"),
    transformerDefaults: {
      appStoreType: "sql",
      adminStoreType: "filesystem",
      postgresHost: "localhost",
    },
    description: "Local default — admin filesystem, miroir + library Postgres",
  },
  "emulatedServer-filesystem": {
    name: "emulatedServer-filesystem",
    miroirConfigFilename: configPath("miroirConfig.test-emulatedServer-filesystem.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    transformerDefaults: {
      appStoreType: "filesystem",
      adminStoreType: "filesystem",
    },
    description: "All store sections on filesystem (no Postgres)",
  },
  "emulatedServer-indexedDb": {
    name: "emulatedServer-indexedDb",
    miroirConfigFilename: configPath("miroirConfig.test-emulatedServer-indexedDb.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    transformerDefaults: {
      appStoreType: "indexedDb",
      adminStoreType: "filesystem",
    },
    description: "Miroir + library IndexedDB",
  },
  "emulatedServer-mongodb": {
    name: "emulatedServer-mongodb",
    miroirConfigFilename: configPath("miroirConfig.test-emulatedServer-mongodb.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    transformerDefaults: {
      appStoreType: "mongodb",
      adminStoreType: "filesystem",
    },
    description: "Miroir + library MongoDB",
  },
  "ci-emulatedServer-host-sql": {
    name: "ci-emulatedServer-host-sql",
    miroirConfigFilename: configPath("miroirConfig.test-ci-emulatedServer-host-sql.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    transformerDefaults: {
      appStoreType: "sql",
      adminStoreType: "filesystem",
    },
    description: "CI preset — host Postgres connection strings in JSON",
  },
  "ci-emulatedServer-dockerized-sql": {
    name: "ci-emulatedServer-dockerized-sql",
    miroirConfigFilename: configPath("miroirConfig.test-ci-emulatedServer-dockerized-sql.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    transformerDefaults: {
      appStoreType: "sql",
      adminStoreType: "filesystem",
    },
    description: "CI preset — dockerized Postgres connection strings in JSON",
  },
};

export function listIntegrationTestProfileNames(): string[] {
  return Object.keys(INTEGRATION_TEST_PROFILES).sort();
}

function applyEnvVar(key: string, value: string, respectExistingEnv: boolean): void {
  if (respectExistingEnv && process.env[key]) {
    return;
  }
  process.env[key] = value;
}

function applyTransformerDefaults(
  defaults: IntegrationTestTransformerDefaults,
  respectExistingEnv: boolean,
): void {
  if (defaults.appStoreType) {
    applyEnvVar("MIROIR_TEST_APP_STORE_TYPE", defaults.appStoreType, respectExistingEnv);
  }
  if (defaults.adminStoreType) {
    applyEnvVar("MIROIR_TEST_ADMIN_STORE_TYPE", defaults.adminStoreType, respectExistingEnv);
  }
  if (defaults.postgresHost) {
    applyEnvVar("MIROIR_TEST_POSTGRES_HOST", defaults.postgresHost, respectExistingEnv);
  }
  if (defaults.adminSqlSchema) {
    applyEnvVar("MIROIR_TEST_ADMIN_SQL_SCHEMA", defaults.adminSqlSchema, respectExistingEnv);
  }
}

export function applyIntegrationTestProfile(
  profileName: string | undefined,
  options: ApplyIntegrationTestProfileOptions = {},
): IntegrationTestProfile | undefined {
  if (!profileName) {
    return undefined;
  }

  const profile = INTEGRATION_TEST_PROFILES[profileName];
  if (!profile) {
    throw new Error(
      `Unknown integration test profile: ${profileName}. ` +
        `Valid profiles: ${listIntegrationTestProfileNames().join(", ")}`,
    );
  }

  const respectExistingEnv = options.respectExistingEnv !== false;

  applyEnvVar(
    "VITE_MIROIR_TEST_CONFIG_FILENAME",
    profile.miroirConfigFilename,
    respectExistingEnv,
  );
  applyEnvVar("VITE_MIROIR_LOG_CONFIG_FILENAME", profile.logConfigFilename, respectExistingEnv);

  if (profile.transformerDefaults) {
    applyTransformerDefaults(profile.transformerDefaults, respectExistingEnv);
  }

  return profile;
}
