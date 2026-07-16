/**
 * Gap D — unified integration test profiles (standalone-app).
 * Paths are relative to the repository root (joined with process.env.PWD in loadTestConfigFiles).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  deriveTestSessionDefaultsFromMiroirConfig,
  type MiroirConfigForDerivation,
} from "./deriveTestSessionDefaultsFromMiroirConfig.js";

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
  /** Optional overrides merged on top of JSON-derived defaults (D2). */
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
    description: "Local default — admin filesystem, miroir + library Postgres",
  },
  "emulatedServer-filesystem": {
    name: "emulatedServer-filesystem",
    miroirConfigFilename: configPath("miroirConfig.test-emulatedServer-filesystem.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    description: "All store sections on filesystem (no Postgres)",
  },
  "emulatedServer-indexedDb": {
    name: "emulatedServer-indexedDb",
    miroirConfigFilename: configPath("miroirConfig.test-emulatedServer-indexedDb.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    description: "Miroir + library IndexedDB",
  },
  "emulatedServer-mongodb": {
    name: "emulatedServer-mongodb",
    miroirConfigFilename: configPath("miroirConfig.test-emulatedServer-mongodb.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    description: "Miroir + library MongoDB",
  },
  "ci-emulatedServer-host-sql": {
    name: "ci-emulatedServer-host-sql",
    miroirConfigFilename: configPath("miroirConfig.test-ci-emulatedServer-host-sql.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    description: "CI preset — host Postgres connection strings in JSON",
  },
  "ci-emulatedServer-dockerized-sql": {
    name: "ci-emulatedServer-dockerized-sql",
    miroirConfigFilename: configPath("miroirConfig.test-ci-emulatedServer-dockerized-sql.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    description: "CI preset — dockerized Postgres connection strings in JSON",
  },
  "realServer-sql": {
    name: "realServer-sql",
    miroirConfigFilename: configPath("miroirConfig.test-realServer-sql.json"),
    logConfigFilename: logPath("specificLoggersConfig_DomainController_debug.json"),
    description: "Client REST → live miroir-server (Postgres stores on server) — B6-c",
  },
  "realServer-indexedDb": {
    name: "realServer-indexedDb",
    miroirConfigFilename: configPath("miroirConfig.test-realServer-indexedDb.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    description: "Client REST → live miroir-server (IndexedDB stores on server) — B6-c",
  },
  "realServer-filesystem": {
    name: "realServer-filesystem",
    miroirConfigFilename: configPath("miroirConfig.test-realServer-filesystem.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    description: "Client REST → live miroir-server (filesystem stores on server) — B6-c",
  },
  "realServer-mongodb": {
    name: "realServer-mongodb",
    miroirConfigFilename: configPath("miroirConfig.test-realServer-mongodb.json"),
    logConfigFilename: logPath("specificLoggersConfig_warn.json"),
    description: "Client REST → live miroir-server (MongoDB stores on server) — B6-c",
  },
};

export function listIntegrationTestProfileNames(): string[] {
  return Object.keys(INTEGRATION_TEST_PROFILES).sort();
}

const STANDALONE_APP_PACKAGE_DIR = "packages/miroir-standalone-app";

/** Resolve monorepo root for repo-relative profile paths (no import.meta — tests/ is outside tsconfig). */
export function resolveRepoRoot(): string {
  const candidates = [
    process.env.PWD,
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "../.."),
    path.resolve(process.cwd(), "../../.."),
  ].filter((value): value is string => Boolean(value));

  for (const candidate of [...new Set(candidates)]) {
    if (existsSync(path.join(candidate, STANDALONE_APP_PACKAGE_DIR))) {
      return candidate;
    }
  }

  const standaloneAppRoot = path.resolve(process.cwd(), "..");
  if (existsSync(path.join(standaloneAppRoot, "tests/miroirConfig.test-emulatedServer-sql.json"))) {
    return path.resolve(standaloneAppRoot, "../..");
  }

  throw new Error(
    "Cannot resolve monorepo root for integration test profile JSON (set PWD to repo root)",
  );
}

export function loadMiroirConfigJsonFromProfilePath(relativePath: string): MiroirConfigForDerivation {
  const normalized = relativePath.startsWith("./") ? relativePath.slice(2) : relativePath;
  const configFilePath = path.join(resolveRepoRoot(), normalized);
  if (!existsSync(configFilePath)) {
    throw new Error(`Integration test profile config not found: ${configFilePath}`);
  }
  return JSON.parse(readFileSync(configFilePath, "utf8")) as MiroirConfigForDerivation;
}

export function resolveTransformerDefaultsForProfile(
  profile: IntegrationTestProfile,
): IntegrationTestTransformerDefaults {
  let derived: Partial<IntegrationTestTransformerDefaults> = {};
  try {
    const config = loadMiroirConfigJsonFromProfilePath(profile.miroirConfigFilename);
    derived = deriveTestSessionDefaultsFromMiroirConfig(config);
  } catch {
    derived = {};
  }
  return { ...derived, ...profile.transformerDefaults };
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

  const transformerDefaults = resolveTransformerDefaultsForProfile(profile);
  if (Object.keys(transformerDefaults).length > 0) {
    applyTransformerDefaults(transformerDefaults, respectExistingEnv);
  }

  return profile;
}
