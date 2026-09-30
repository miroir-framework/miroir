import {
  miroirEnvironment,
  type MiroirEnvironment,
  type MiroirEnvironmentApplication,
  type MiroirEnvironmentSectionMode,
  type MiroirEnvironmentStoreType,
  type StoreSectionConfiguration,
  type StoreUnitConfiguration,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
// Environments (#321): an environment definition says which applications are installed and where
// each store section lives. Paths are relative to the repository root, which is the
// filesystemDeploymentRootDirectory of every environment.
// ################################################################################################

export const ENVIRONMENT_STATE_ROOT = ".miroir";

/** The framework applications without which the platform does not start. */
export const REQUIRED_ENVIRONMENT_APPLICATIONS = ["miroir", "admin"] as const;

const TEST_ENVIRONMENT_PREFIX = "test-";

/** Test environments (`test-*`) hold copies only, and test runs select nothing else. */
export function isTestEnvironment(name: string): boolean {
  return name.startsWith(TEST_ENVIRONMENT_PREFIX);
}

/**
 * Where the applications installed at runtime (Runners deployApplication, createApplication) put
 * their stores: `.miroir/<environment>/apps`, relative to the repository root.
 */
export function environmentAppsDirectory(environmentName: string): string {
  return `${ENVIRONMENT_STATE_ROOT}/${environmentName}/apps`;
}

/**
 * An environment definition as written in a file: any field may be partial, since it is merged
 * over the environment it extends. `null` removes an inherited entry.
 */
export type EnvironmentDefinition = { extends?: string } & Record<string, unknown>;

export type EnvironmentResolution =
  | { status: "ok"; chain: string[]; environment: MiroirEnvironment }
  | { status: "error"; errors: string[] };

export type EnvironmentDeployment = {
  applicationKey: string;
  /** Absent for an application that gives its configuration and names no package. */
  package?: string;
  deployment: string;
  selfApplication: string;
  configuration: StoreUnitConfiguration;
};

export type EnvironmentDeploymentsResult =
  | { status: "ok"; deployments: EnvironmentDeployment[] }
  | { status: "error"; errors: string[] };

export type EnvironmentSectionName = "admin" | "model" | "data" | "modelVersion";

/** The store sections of an installed application: admin, model, data, and modelVersion when declared. */
export function environmentSections(application: MiroirEnvironmentApplication): EnvironmentSectionName[] {
  return application.sections?.modelVersion ? ["admin", "model", "data", "modelVersion"] : ["admin", "model", "data"];
}

/** An application derived from its package: package, store and mode are given. */
type PackageApplication = MiroirEnvironmentApplication & {
  package: string;
  store: MiroirEnvironmentStoreType;
  mode: MiroirEnvironmentSectionMode;
};

const PACKAGE_APPLICATION_FIELDS = ["package", "store", "mode"] as const;

/**
 * The fields an application misses to be derived from its package: none when it gives its
 * configuration (an application installed outside the package layout, used as given).
 */
export function missingApplicationFields(application: MiroirEnvironmentApplication): string[] {
  return application.configuration ? [] : PACKAGE_APPLICATION_FIELDS.filter((field) => application[field] === undefined);
}

/**
 * A section's own mode when overridden, else the application's; `admin` always follows the
 * application. Undefined for an application that gives its configuration.
 */
export function environmentSectionMode(
  application: MiroirEnvironmentApplication,
  section: EnvironmentSectionName,
): MiroirEnvironmentSectionMode | undefined {
  if (application.configuration) {
    return undefined;
  }
  return (section === "admin" ? undefined : application.sections?.[section]?.mode) ?? application.mode;
}

function environmentSectionStore(application: PackageApplication, section: EnvironmentSectionName): MiroirEnvironmentStoreType {
  return (section === "admin" ? undefined : application.sections?.[section]?.store) ?? application.store;
}

/** Where the application packages are, relative to the root: `packages` in a checkout. */
export const DEFAULT_PACKAGES_DIRECTORY = "packages";

/**
 * Where a section lives in the application package (root-relative): what a `live` section opens
 * and what a `copy` section is seeded from. `packagesDirectory` is the environment's (#345): `.`
 * for a root laid out as `<package>/assets` (a Docker volume, packaged Electron's user data).
 */
export function applicationAssetsDirectory(
  applicationKey: string,
  application: { package: string; assetPrefix?: string },
  section: EnvironmentSectionName,
  packagesDirectory: string = DEFAULT_PACKAGES_DIRECTORY,
): string {
  const packages = packagesDirectory.replace(/\/+$/, "");
  const assets = packages === "." || packages === "" ? `${application.package}/assets` : `${packages}/${application.package}/assets`;
  return section === "admin" ? assets : `${assets}/${application.assetPrefix ?? applicationKey}_${section}`;
}

function sectionDirectory(
  environment: MiroirEnvironment,
  environmentName: string,
  applicationKey: string,
  application: PackageApplication,
  mode: MiroirEnvironmentSectionMode,
  section: EnvironmentSectionName,
): string {
  if (mode === "live") {
    return applicationAssetsDirectory(applicationKey, application, section, environment.packagesDirectory);
  }
  const state = `${ENVIRONMENT_STATE_ROOT}/${environmentName}/${applicationKey}`;
  return section === "admin" ? state : `${state}/${section}`;
}

/** A SQL schema, MongoDB database or IndexedDB name part: `test-sql`, `miroir` → `test_sql_miroir`. */
function storeIdentifier(environmentName: string, applicationKey: string): string {
  return `${environmentName}_${applicationKey}`.replace(/[^A-Za-z0-9_]/g, "_");
}

/** Postgres connection without password: the run adds it from `passwordEnv` (miroir-env). */
function postgresConnectionString(postgres: NonNullable<NonNullable<MiroirEnvironment["connections"]>["postgres"]>): string {
  return `postgres://${postgres.user ?? "postgres"}@${postgres.host}:${postgres.port ?? 5432}/${postgres.database ?? "postgres"}`;
}

/**
 * Where a section lives. Filesystem sections are directories (package assets when `live`,
 * `.miroir/<environment>/<application>/<section>` when `copy`). The other stores are always copies,
 * named after the environment and the application: SQL schema and MongoDB database
 * `<environment>_<application>`, IndexedDB `.miroir/<environment>/<application>/indexedDb`; the
 * modelVersion and admin sections add `_modelVersion` and `_admin` (an admin store opens, and on
 * deletion may drop, a database of its own).
 */
function sectionConfiguration(
  environment: MiroirEnvironment,
  environmentName: string,
  applicationKey: string,
  application: PackageApplication,
  mode: MiroirEnvironmentSectionMode,
  store: MiroirEnvironmentStoreType,
  section: EnvironmentSectionName,
): StoreSectionConfiguration | string {
  const where = `application "${applicationKey}", section "${section}"`;
  const suffix = section === "modelVersion" ? "_modelVersion" : section === "admin" ? "_admin" : "";
  switch (store) {
    case "filesystem":
      return {
        emulatedServerType: "filesystem",
        directory: sectionDirectory(environment, environmentName, applicationKey, application, mode, section),
      };
    case "sql": {
      const postgres = environment.connections?.postgres;
      if (!postgres) {
        return `${where}: store "sql" needs connections.postgres`;
      }
      return {
        emulatedServerType: "sql",
        connectionString: postgresConnectionString(postgres),
        schema: `${storeIdentifier(environmentName, applicationKey)}${suffix}`,
        forceNullOptionalAttributeToUndefined: true,
      };
    }
    case "mongodb": {
      const mongodb = environment.connections?.mongodb;
      if (!mongodb) {
        return `${where}: store "mongodb" needs connections.mongodb`;
      }
      return {
        emulatedServerType: "mongodb",
        connectionString: mongodb.url,
        database: `${storeIdentifier(environmentName, applicationKey)}${suffix}`,
      };
    }
    case "indexedDb":
      return {
        emulatedServerType: "indexedDb",
        indexedDbName: `${ENVIRONMENT_STATE_ROOT}/${environmentName}/${applicationKey}/indexedDb${suffix}`,
      };
  }
}

/**
 * The Deployment configurations of every application installed in an environment.
 * `live` sections point at the application package's assets (edits become git diffs);
 * `copy` sections live in the environment state directory `.miroir/<environmentName>/`;
 * an application that gives its configuration keeps it as given.
 */
export function deriveEnvironmentDeployments(
  environment: MiroirEnvironment,
  environmentName: string,
): EnvironmentDeploymentsResult {
  const errors: string[] = [];
  const deployments: EnvironmentDeployment[] = [];

  for (const [applicationKey, application] of Object.entries(environment.applications ?? {})) {
    if (!application) {
      continue;
    }
    const identity = {
      applicationKey,
      ...(application.package ? { package: application.package } : {}),
      deployment: application.deployment,
      selfApplication: application.selfApplication,
    };
    if (application.configuration) {
      deployments.push({ ...identity, configuration: application.configuration });
      continue;
    }
    const missing = missingApplicationFields(application);
    if (missing.length > 0) {
      errors.push(`application "${applicationKey}": ${missing.join(", ")} required unless the application gives its configuration`);
      continue;
    }
    const packageApplication = application as PackageApplication;
    const configuration: Record<string, StoreSectionConfiguration> = {};
    for (const section of environmentSections(application)) {
      const mode = environmentSectionMode(packageApplication, section)!;
      const store = environmentSectionStore(packageApplication, section);
      if (mode === "live" && store !== "filesystem") {
        errors.push(`application "${applicationKey}", section "${section}": mode "live" needs store "filesystem", got "${store}"`);
        continue;
      }
      const result = sectionConfiguration(environment, environmentName, applicationKey, packageApplication, mode, store, section);
      if (typeof result === "string") {
        errors.push(result);
        continue;
      }
      configuration[section] = result;
    }
    deployments.push({ ...identity, configuration: configuration as StoreUnitConfiguration });
  }

  return errors.length > 0 ? { status: "error", errors } : { status: "ok", deployments };
}


// ################################################################################################
// Resolution of the extends chain.
// ################################################################################################

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Objects merge key by key, arrays and scalars are replaced, `null` removes the key. */
function mergeDefinitions(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === null) {
      delete result[key];
    } else if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeDefinitions(result[key] as Record<string, unknown>, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function extendsChain(definitions: Record<string, EnvironmentDefinition>, name: string): string[] | string {
  const known = Object.keys(definitions).sort().join(", ");
  if (!definitions[name]) {
    return `environment "${name}" not found; known environments: ${known}`;
  }
  const chain = [name];
  for (let parent = definitions[name].extends; parent !== undefined; parent = definitions[parent].extends) {
    if (chain.includes(parent)) {
      return `extends cycle: ${[...chain, parent].join(" -> ")}`;
    }
    if (!definitions[parent]) {
      return `environment "${parent}" not found (extended by "${chain[chain.length - 1]}"); known environments: ${known}`;
    }
    chain.push(parent);
  }
  return chain;
}

/** Applications that neither give their configuration nor package, store and mode (merged, unvalidated input). */
function applicationFieldErrors(name: string, applications: unknown): string[] {
  if (!isPlainObject(applications)) {
    return [];
  }
  return Object.entries(applications).flatMap(([applicationKey, application]) =>
    isPlainObject(application)
      ? missingApplicationFields(application as MiroirEnvironmentApplication).map(
          (field) =>
            `environment "${name}": applications.${applicationKey}.${field}: required unless the application gives its configuration`,
        )
      : [],
  );
}

function environmentRuleErrors(name: string, environment: MiroirEnvironment): string[] {
  const errors: string[] = [];
  for (const required of REQUIRED_ENVIRONMENT_APPLICATIONS) {
    if (!environment.applications?.[required]) {
      errors.push(`environment "${name}" must install application "${required}"`);
    }
  }
  errors.push(...applicationFieldErrors(name, environment.applications));
  if (isTestEnvironment(name)) {
    for (const [applicationKey, application] of Object.entries(environment.applications ?? {})) {
      if (!application) {
        continue;
      }
      if (application.configuration) {
        errors.push(
          `environment "${name}": application "${applicationKey}" gives its configuration; test environments derive every store from the definition`,
        );
        continue;
      }
      for (const section of environmentSections(application)) {
        if (environmentSectionMode(application, section) === "live") {
          errors.push(
            `environment "${name}": application "${applicationKey}", section "${section}" is live; test environments use copy only`,
          );
        }
      }
    }
  }
  return errors;
}

/**
 * Resolves `name` through its `extends` chain (child first in `chain`), merges the definitions,
 * validates the result against the miroirEnvironment schema and checks the rules every
 * environment satisfies: miroir and admin installed, no live section in a `test-*` environment.
 */
export function resolveEnvironment(
  definitions: Record<string, EnvironmentDefinition>,
  name: string,
): EnvironmentResolution {
  const chain = extendsChain(definitions, name);
  if (typeof chain === "string") {
    return { status: "error", errors: [chain] };
  }

  const merged = [...chain]
    .reverse()
    .reduce<Record<string, unknown>>((result, link) => mergeDefinitions(result, definitions[link]), {});
  delete merged.extends;
  merged.name = name;

  const parsed = miroirEnvironment.safeParse(merged);
  if (!parsed.success) {
    return {
      status: "error",
      errors: [
        ...parsed.error.issues.map((issue) => `environment "${name}": ${issue.path.join(".") || "(root)"}: ${issue.message}`),
        ...applicationFieldErrors(name, merged.applications),
      ],
    };
  }

  const environment = merged as MiroirEnvironment;
  const errors = environmentRuleErrors(name, environment);
  return errors.length > 0 ? { status: "error", errors } : { status: "ok", chain, environment };
}
