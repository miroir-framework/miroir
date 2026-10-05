/**
 * Gap D — unified integration test profiles (standalone-app).
 * Paths are relative to the repository root (joined with process.env.PWD in loadTestConfigFiles).
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { isTestEnvironment } from "miroir-core";
import { environmentClientConfig, resolveEnvironmentFromFiles } from "miroir-env";

import { deriveTestSessionDefaultsFromMiroirConfig } from "./deriveTestSessionDefaultsFromMiroirConfig.js";

export type IntegrationTestTransformerDefaults = {
  appStoreType?: "sql" | "filesystem" | "indexedDb" | "mongodb";
  adminStoreType?: "filesystem" | "sql" | "indexedDb" | "mongodb" | "bundled";
  postgresHost?: string;
  adminSqlSchema?: string;
};

export type IntegrationTestProfile = {
  name: string;
  logConfigFilename: string;
  /** #321: the test environment (environments/<name>.json) the profile selects through MIROIR_ENV. */
  environment: string;
  /**
   * #321: `realServer` for a client that calls a running miroir-server with the stores of the
   * environment (the realServer-* profiles); otherwise the client emulates the server in process.
   * Selected through MIROIR_TEST_CLIENT.
   */
  client?: "realServer";
  /** Optional overrides merged on top of JSON-derived defaults (D2). */
  transformerDefaults?: IntegrationTestTransformerDefaults;
  description?: string;
};

export type ApplyIntegrationTestProfileOptions = {
  /** When true (default), do not overwrite env vars already set — G5 */
  respectExistingEnv?: boolean;
};

/** Canonical consolidated log presets (shared by tests and dev/runtime). */
const LOG_CONFIGS = "./packages/miroir-standalone-app/config/logging";

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
    logConfigFilename: logPath("catch-all.json"),
    environment: "test-sql",
    client: "realServer",
    description: "Client REST → live miroir-server, on the Postgres stores of test-sql — B6-c",
  },
  "realServer-indexedDb": {
    name: "realServer-indexedDb",
    logConfigFilename: logPath("catch-all.json"),
    environment: "test-indexedDb",
    client: "realServer",
    description: "Client REST → live miroir-server, on the IndexedDB stores of test-indexedDb — B6-c",
  },
  "realServer-filesystem": {
    name: "realServer-filesystem",
    logConfigFilename: logPath("catch-all.json"),
    environment: "test-filesystem",
    client: "realServer",
    description: "Client REST → live miroir-server, on the filesystem stores of test-filesystem — B6-c",
  },
  "realServer-mongodb": {
    name: "realServer-mongodb",
    logConfigFilename: logPath("catch-all.json"),
    environment: "test-mongodb",
    client: "realServer",
    description: "Client REST → live miroir-server, on the MongoDB stores of test-mongodb — B6-c",
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

export function resolveTransformerDefaultsForProfile(
  profile: IntegrationTestProfile,
): IntegrationTestTransformerDefaults {
  let derived: Partial<IntegrationTestTransformerDefaults> = {};
  try {
    const config = environmentClientConfig(
      resolveEnvironmentFromFiles({
        cwd: resolveRepoRoot(),
        // #477: a nonreg worker's stores are named after its worker state
        env: { MIROIR_ENV: profile.environment, MIROIR_TEST_WORKER: process.env.MIROIR_TEST_WORKER },
      }),
    );
    derived = deriveTestSessionDefaultsFromMiroirConfig(config);
  } catch {
    derived = {};
  }
  return { ...derived, ...profile.transformerDefaults };
}

/** Variables that select stores: a shell value that differs from the profile's is a deviation (#321). */
const STORE_SELECTING_VARIABLES = new Set([
  "MIROIR_ENV",
  "MIROIR_TEST_CLIENT",
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

  // only another test environment may take precedence: tests never run on dev or local
  deviations.push(
    applyEnvVar(
      "MIROIR_ENV",
      profile.environment,
      respectExistingEnv && isTestEnvironment(process.env.MIROIR_ENV ?? ""),
    ),
    applyEnvVar("MIROIR_TEST_CLIENT", profile.client ?? "emulatedServer", respectExistingEnv),
  );
  // the environment replaces the configuration file: one set in the shell would be ignored
  const configFile = process.env.VITE_MIROIR_TEST_CONFIG_FILENAME;
  if (configFile && respectExistingEnv) {
    deviations.push(
      `VITE_MIROIR_TEST_CONFIG_FILENAME=${configFile} is ignored, the profile uses environment ${process.env.MIROIR_ENV}`,
    );
  }
  delete process.env.VITE_MIROIR_TEST_CONFIG_FILENAME;
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
