import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  applicationAssetsDirectory,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENVIRONMENT_STATE_ROOT,
  ENTITY_DEPLOYMENT_UUID,
  environmentAppsDirectory,
  environmentSectionMode,
  environmentSections,
  type MiroirConfigClient,
  type MiroirConfigEnvironment,
  type MiroirConfigServer,
  type StoreSectionConfiguration,
  type StoreUnitConfiguration,
} from "miroir-core";

import { stableJson } from "./adminRows.js";
import { EnvironmentError, type ResolvedEnvironment } from "./environmentFiles.js";

// ################################################################################################
// Environment state (#321): `copy` sections live in .miroir/<environment>/ (gitignored), seeded
// from the application package assets on first use. Admin's Deployment and AdminApplication rows
// are not seeded: they are generated from the definition (openEnvironment.ts). Every start records
// the definition it used in .miroir/<environment>/env.lock.json, so that `miroir-env show` can
// tell when the definition changed since.
// ################################################################################################

export const ENVIRONMENT_LOCK_FILE = "env.lock.json";

/** Admin data entities whose rows are generated from the environment definition, never seeded. */
export const GENERATED_ADMIN_ENTITIES = [ENTITY_DEPLOYMENT_UUID, ENTITY_ADMIN_APPLICATION_UUID];

export type SeedReport = {
  /** `<application>/<section>` copied from the package assets. */
  seeded: string[];
  /** `<application>/<section>` already present in the state, left as is. */
  kept: string[];
};

/**
 * Seeds every `copy` filesystem section that is missing from the environment state.
 * `reseed` wipes and seeds them again (test sessions start from the seed every time).
 */
export function seedEnvironmentState(resolved: ResolvedEnvironment, options: { reseed?: boolean } = {}): SeedReport {
  const report: SeedReport = { seeded: [], kept: [] };
  for (const deployment of resolved.deployments) {
    const application = resolved.environment.applications?.[deployment.applicationKey];
    if (!application?.package) {
      continue;
    }
    for (const section of environmentSections(application)) {
      if (section === "admin" || environmentSectionMode(application, section) !== "copy") {
        continue;
      }
      const configuration = (deployment.configuration as Record<string, StoreSectionConfiguration>)[section];
      if (!configuration || !("directory" in configuration)) {
        continue;
      }
      const name = `${deployment.applicationKey}/${section}`;
      const target = path.join(resolved.repositoryRoot, configuration.directory);
      if (existsSync(target)) {
        if (!options.reseed) {
          report.kept.push(name);
          continue;
        }
        rmSync(target, { recursive: true, force: true });
      }
      const source = path.join(
        resolved.repositoryRoot,
        applicationAssetsDirectory(deployment.applicationKey, { ...application, package: application.package }, section),
      );
      if (existsSync(source)) {
        // the entity directories of generated rows are kept (a filesystem data section knows its
        // entities by their directories), their rows are not
        const generated =
          deployment.applicationKey === "admin" && section === "data"
            ? GENERATED_ADMIN_ENTITIES.map((entity) => path.join(source, entity))
            : [];
        cpSync(source, target, { recursive: true, filter: (file) => !generated.includes(path.dirname(file)) });
      } else {
        mkdirSync(target, { recursive: true });
      }
      report.seeded.push(name);
    }
  }
  writeEnvironmentLock(resolved);
  return report;
}

/** The state directory of an environment, relative to the repository root. */
export function environmentStateDirectory(resolved: ResolvedEnvironment): string {
  return `${ENVIRONMENT_STATE_ROOT}/${resolved.name}`;
}

export type EnvironmentLock = {
  environment: string;
  /** sha256 of the resolved definition. */
  definitionHash: string;
  files: string[];
  deployments: Record<string, { applicationKey: string; configuration: unknown }>;
};

function definitionHash(resolved: ResolvedEnvironment): string {
  return createHash("sha256").update(stableJson(resolved.environment)).digest("hex");
}

/** The record of the definition an environment state was last started with. */
export function environmentLock(resolved: ResolvedEnvironment): EnvironmentLock {
  return {
    environment: resolved.name,
    definitionHash: definitionHash(resolved),
    files: resolved.files,
    deployments: Object.fromEntries(
      resolved.deployments.map((d) => [d.deployment, { applicationKey: d.applicationKey, configuration: d.configuration }]),
    ),
  };
}

function writeEnvironmentLock(resolved: ResolvedEnvironment): void {
  const directory = path.join(resolved.repositoryRoot, environmentStateDirectory(resolved));
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, ENVIRONMENT_LOCK_FILE), JSON.stringify(environmentLock(resolved), null, 2) + "\n");
}

/**
 * Where the state of an environment stands against its definition: never started, started before
 * env.lock.json existed (or copied by `miroir-env import`), started with the current definition,
 * or with another one (`changes` says which applications differ).
 */
export type EnvironmentStateStatus =
  | { status: "absent" | "unrecorded" | "current"; directory: string }
  | { status: "changed"; directory: string; changes: string[] };

export function environmentStateStatus(resolved: ResolvedEnvironment): EnvironmentStateStatus {
  const directory = environmentStateDirectory(resolved);
  const lockFile = path.join(resolved.repositoryRoot, directory, ENVIRONMENT_LOCK_FILE);
  if (!existsSync(lockFile)) {
    return { status: existsSync(path.join(resolved.repositoryRoot, directory)) ? "unrecorded" : "absent", directory };
  }
  const lock = JSON.parse(readFileSync(lockFile, "utf-8")) as EnvironmentLock;
  const current = environmentLock(resolved);
  if (lock.definitionHash === current.definitionHash) {
    return { status: "current", directory };
  }
  const byKey = (deployments: EnvironmentLock["deployments"]) =>
    new Map(Object.entries(deployments ?? {}).map(([uuid, d]) => [d.applicationKey, stableJson({ uuid, configuration: d.configuration })]));
  const before = byKey(lock.deployments);
  const after = byKey(current.deployments);
  const changes = [...new Set([...before.keys(), ...after.keys()])]
    .sort()
    .flatMap((key) =>
      !after.has(key) ? [`${key} removed`] : !before.has(key) ? [`${key} added`] : before.get(key) !== after.get(key) ? [`${key} changed`] : [],
    );
  return { status: "changed", directory, changes: changes.length > 0 ? changes : ["settings changed"] };
}

export function describeEnvironmentStateStatus(state: EnvironmentStateStatus): string {
  switch (state.status) {
    case "absent":
      return `state ${state.directory}: not started yet`;
    case "unrecorded":
      return `state ${state.directory}: no record of the definition it was last started with`;
    case "current":
      return `state ${state.directory}: last started with the current definition`;
    case "changed":
      return `state ${state.directory}: last started with another definition (${state.changes.join(", ")}); the next start reconciles it`;
  }
}

/** The environment a configuration comes from, and where the applications installed at runtime go. */
function configEnvironment(resolved: ResolvedEnvironment): MiroirConfigEnvironment {
  return { name: resolved.name, appsDirectory: environmentAppsDirectory(resolved.name) };
}

/** The server configuration of an environment; the filesystem root is the repository root. */
export function environmentServerConfig(resolved: ResolvedEnvironment): MiroirConfigServer {
  const server = resolved.environment.server;
  if (!server?.rootApiUrl) {
    throw new EnvironmentError(`environment "${resolved.name}" has no server.rootApiUrl: it cannot start a server`);
  }
  const config = {
    miroirConfigType: "server",
    server: {
      rootApiUrl: server.rootApiUrl,
      ...(server.mcpUrl ? { mcpUrl: server.mcpUrl } : {}),
      filesystemDeploymentRootDirectory: resolved.repositoryRoot,
      ...(server.corsAllowedOrigins ? { corsAllowedOrigins: server.corsAllowedOrigins } : {}),
    },
    environment: configEnvironment(resolved),
    ...(resolved.environment.features ? { features: resolved.environment.features } : {}),
  };
  return config as MiroirConfigServer;
}

/** Whether an installed application of the environment has a section on the given store. */
function usesStore(resolved: ResolvedEnvironment, store: string): boolean {
  return resolved.deployments.some((deployment) =>
    Object.values(deployment.configuration).some((section) => section?.emulatedServerType === store),
  );
}

/**
 * Warnings about database passwords a run of the environment needs and cannot find: the
 * definition names the variable (`connections.postgres.passwordEnv`), never the password.
 */
export function missingConnectionPasswords(resolved: ResolvedEnvironment, env: NodeJS.ProcessEnv): string[] {
  const passwordEnv = resolved.environment.connections?.postgres?.passwordEnv;
  if (!passwordEnv || env[passwordEnv] || !usesStore(resolved, "sql")) {
    return [];
  }
  return [
    `environment "${resolved.name}": ${passwordEnv} is not set, PostgreSQL connections go without a password (PGPASSWORD or ~/.pgpass may still provide one)`,
  ];
}

/** The deployment configuration with the Postgres password from `connections.postgres.passwordEnv`. */
function withConnectionPasswords(
  resolved: ResolvedEnvironment,
  configuration: StoreUnitConfiguration,
  env: NodeJS.ProcessEnv,
): StoreUnitConfiguration {
  const passwordEnv = resolved.environment.connections?.postgres?.passwordEnv;
  const password = passwordEnv ? env[passwordEnv] : undefined;
  if (!password) {
    return configuration;
  }
  const sections = Object.entries(configuration).map(([section, store]) => [
    section,
    store?.emulatedServerType === "sql"
      ? {
          ...store,
          connectionString: store.connectionString.replace(
            /^(postgres(?:ql)?:\/\/[^:@/]+)@/,
            `$1:${encodeURIComponent(password)}@`,
          ),
        }
      : store,
  ]);
  return Object.fromEntries(sections) as StoreUnitConfiguration;
}

/**
 * The client configuration of an environment run with an emulated server (tests): the stores of
 * every installed application, opened in process; the filesystem root is the repository root.
 * `env` provides the database passwords the definition names.
 */
export function environmentClientConfig(resolved: ResolvedEnvironment, env: NodeJS.ProcessEnv = {}): MiroirConfigClient {
  const rootApiUrl = resolved.environment.server?.rootApiUrl;
  if (!rootApiUrl) {
    throw new EnvironmentError(`environment "${resolved.name}" has no server.rootApiUrl: it cannot emulate a server`);
  }
  const deploymentStorageConfig: Record<string, StoreUnitConfiguration> = Object.fromEntries(
    resolved.deployments.map((deployment) => [
      deployment.deployment,
      withConnectionPasswords(resolved, deployment.configuration as StoreUnitConfiguration, env),
    ]),
  );
  const config = {
    miroirConfigType: "client",
    client: {
      emulateServer: true,
      rootApiUrl,
      filesystemDeploymentRootDirectory: resolved.repositoryRoot,
      deploymentStorageConfig,
    },
    environment: configEnvironment(resolved),
    ...(resolved.environment.features ? { features: resolved.environment.features } : {}),
  };
  return config as MiroirConfigClient;
}
