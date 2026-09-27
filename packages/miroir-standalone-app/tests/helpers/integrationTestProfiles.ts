/**
 * Gap D — unified integration test profiles (standalone-app).
 * Paths are relative to the repository root (joined with process.env.PWD in loadTestConfigFiles).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { isTestEnvironment } from "miroir-core";
import { environmentClientConfig, resolveEnvironmentFromFiles } from "miroir-env";

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
  /** The configuration file of a profile without environment (the realServer-* profiles). */
  miroirConfigFilename?: string;
  logConfigFilename: string;
  /** #321: the test environment (environments/<name>.json) the profile selects through MIROIR_ENV. */
  environment?: string;
  /** Optional overrides merged on top of JSON-derived defaults (D2). */
  transformerDefaults?: IntegrationTestTransformerDefaults;
  description?: string;
};

export type ApplyIntegrationTestProfileOptions = {
  /** When true (default), do not overwrite env vars already set — G5 */
  respectExistingEnv?: boolean;
};

const TESTS = "./packages/miroir-standalone-app/tests";
/** Canonical consolidated log presets (shared by tests and dev/runtime). */
const LOG_CONFIGS = "./packages/miroir-standalone-app/config/logging";

function configPath(filename: string): string {
  return `${TESTS}/${filename}`;
}

function logPath(filename: string): string {
  return `${LOG_CONFIGS}/${filename}`;
}

export const INTEGRATION_TEST_PROFILES: Record<string, IntegrationTestProfile> = {
  "emulatedServer-sql": {
    name: "emulatedServer-sql",
    logConfigFilename: logPath("catch-all.json"),
    environment: "test-sql",
    description: "Local default — admin filesystem, miroir + library Postgres (schemas test_sql_*)",
  },
  "emulatedServer-filesystem": {
    name: "emulatedServer-filesystem",
    logConfigFilename: logPath("catch-all.json"),
    environment: "test-filesystem",
    description: "All store sections on filesystem (no Postgres), in .miroir/test-filesystem",
  },
  "emulatedServer-indexedDb": {
    name: "emulatedServer-indexedDb",
    logConfigFilename: logPath("catch-all.json"),
    environment: "test-indexedDb",
    description: "Miroir + library IndexedDB, in .miroir/test-indexedDb",
  },
  "emulatedServer-mongodb": {
    name: "emulatedServer-mongodb",
    logConfigFilename: logPath("catch-all.json"),
    environment: "test-mongodb",
    description: "Miroir + library MongoDB (databases test_mongodb_*)",
  },
  "realServer-sql": {
    name: "realServer-sql",
    miroirConfigFilename: configPath("miroirConfig.test-realServer-sql.json"),
    logConfigFilename: logPath("catch-all.json"),
    description: "Client REST → live miroir-server (Postgres stores on server) — B6-c",
  },
  "realServer-indexedDb": {
    name: "realServer-indexedDb",
    miroirConfigFilename: configPath("miroirConfig.test-realServer-indexedDb.json"),
    logConfigFilename: logPath("catch-all.json"),
    description: "Client REST → live miroir-server (IndexedDB stores on server) — B6-c",
  },
  "realServer-filesystem": {
    name: "realServer-filesystem",
    miroirConfigFilename: configPath("miroirConfig.test-realServer-filesystem.json"),
    logConfigFilename: logPath("catch-all.json"),
    description: "Client REST → live miroir-server (filesystem stores on server) — B6-c",
  },
  "realServer-mongodb": {
    name: "realServer-mongodb",
    miroirConfigFilename: configPath("miroirConfig.test-realServer-mongodb.json"),
    logConfigFilename: logPath("catch-all.json"),
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
    process.env.INIT_CWD,
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
  if (existsSync(path.join(standaloneAppRoot, "tests/helpers/integrationTestProfiles.ts"))) {
    return path.resolve(standaloneAppRoot, "../..");
  }

  throw new Error(
    "Cannot resolve monorepo root for integration test profiles (set PWD to repo root)",
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
    const config = profile.environment
      ? environmentClientConfig(
          resolveEnvironmentFromFiles({ cwd: resolveRepoRoot(), env: { MIROIR_ENV: profile.environment } }),
        )
      : profile.miroirConfigFilename
        ? loadMiroirConfigJsonFromProfilePath(profile.miroirConfigFilename)
        : {};
    derived = deriveTestSessionDefaultsFromMiroirConfig(config);
  } catch {
    derived = {};
  }
  return { ...derived, ...profile.transformerDefaults };
}

/** Variables that select stores: a shell value that differs from the profile's is a deviation (#321). */
const STORE_SELECTING_VARIABLES = new Set([
  "MIROIR_ENV",
  "VITE_MIROIR_TEST_CONFIG_FILENAME",
  "MIROIR_TEST_APP_STORE_TYPE",
  "MIROIR_TEST_ADMIN_STORE_TYPE",
  "MIROIR_TEST_POSTGRES_HOST",
  "MIROIR_TEST_ADMIN_SQL_SCHEMA",
]);

function isCi(env: NodeJS.ProcessEnv): boolean {
  return Boolean(env.CI) && env.CI !== "false" && env.CI !== "0";
}

/** Sets `key` unless it is already set and respected; returns the deviation when the kept value differs. */
function applyEnvVar(key: string, value: string, respectExistingEnv: boolean): string | undefined {
  const existing = process.env[key];
  if (respectExistingEnv && existing) {
    return existing !== value && STORE_SELECTING_VARIABLES.has(key)
      ? `${key}=${existing} is kept, the profile sets ${value}`
      : undefined;
  }
  process.env[key] = value;
  return undefined;
}

function applyTransformerDefaults(
  defaults: IntegrationTestTransformerDefaults,
  respectExistingEnv: boolean,
): (string | undefined)[] {
  return [
    defaults.appStoreType &&
      applyEnvVar("MIROIR_TEST_APP_STORE_TYPE", defaults.appStoreType, respectExistingEnv),
    defaults.adminStoreType &&
      applyEnvVar("MIROIR_TEST_ADMIN_STORE_TYPE", defaults.adminStoreType, respectExistingEnv),
    defaults.postgresHost &&
      applyEnvVar("MIROIR_TEST_POSTGRES_HOST", defaults.postgresHost, respectExistingEnv),
    defaults.adminSqlSchema &&
      applyEnvVar("MIROIR_TEST_ADMIN_SQL_SCHEMA", defaults.adminSqlSchema, respectExistingEnv),
  ];
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
  const deviations: (string | undefined)[] = [];

  if (profile.environment) {
    // only another test environment may take precedence: tests never run on dev or local
    deviations.push(
      applyEnvVar(
        "MIROIR_ENV",
        profile.environment,
        respectExistingEnv && isTestEnvironment(process.env.MIROIR_ENV ?? ""),
      ),
    );
    // the environment replaces the configuration file: one set in the shell would be ignored
    const configFile = process.env.VITE_MIROIR_TEST_CONFIG_FILENAME;
    if (configFile && respectExistingEnv) {
      deviations.push(
        `VITE_MIROIR_TEST_CONFIG_FILENAME=${configFile} is ignored, the profile uses environment ${process.env.MIROIR_ENV}`,
      );
    }
    delete process.env.VITE_MIROIR_TEST_CONFIG_FILENAME;
  } else {
    if (!respectExistingEnv) {
      // an environment left by a previous profile would win over this profile's configuration file
      delete process.env.MIROIR_ENV;
    }
    if (profile.miroirConfigFilename) {
      deviations.push(
        applyEnvVar("VITE_MIROIR_TEST_CONFIG_FILENAME", profile.miroirConfigFilename, respectExistingEnv),
      );
    }
  }
  deviations.push(
    applyEnvVar("VITE_MIROIR_LOG_CONFIG_FILENAME", profile.logConfigFilename, respectExistingEnv),
    ...applyTransformerDefaults(resolveTransformerDefaultsForProfile(profile), respectExistingEnv),
  );

  const kept = deviations.filter((deviation): deviation is string => Boolean(deviation));
  if (kept.length > 0) {
    const message = `integration test profile ${profile.name}: ${kept.join("; ")}`;
    if (isCi(process.env)) {
      throw new Error(`${message} (CI runs use the profile's values only: unset these variables)`);
    }
    console.warn(`warning: ${message}`);
  }

  return profile;
}
