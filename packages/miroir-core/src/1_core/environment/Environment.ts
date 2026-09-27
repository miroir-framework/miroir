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
  package: string;
  deployment: string;
  selfApplication: string;
  configuration: StoreUnitConfiguration;
};

export type EnvironmentDeploymentsResult =
  | { status: "ok"; deployments: EnvironmentDeployment[] }
  | { status: "error"; errors: string[] };

type SectionName = "model" | "data" | "modelVersion";

function sectionsOf(application: MiroirEnvironmentApplication): SectionName[] {
  return application.sections?.modelVersion ? ["model", "data", "modelVersion"] : ["model", "data"];
}

function sectionDirectory(
  environmentName: string,
  applicationKey: string,
  application: MiroirEnvironmentApplication,
  mode: MiroirEnvironmentSectionMode,
  section: SectionName | "admin",
): string {
  if (mode === "live") {
    const assets = `packages/${application.package}/assets`;
    return section === "admin" ? assets : `${assets}/${application.assetPrefix ?? applicationKey}_${section}`;
  }
  const state = `${ENVIRONMENT_STATE_ROOT}/${environmentName}/${applicationKey}`;
  return section === "admin" ? state : `${state}/${section}`;
}

function sectionConfiguration(
  environmentName: string,
  applicationKey: string,
  application: MiroirEnvironmentApplication,
  mode: MiroirEnvironmentSectionMode,
  store: MiroirEnvironmentStoreType,
  section: SectionName | "admin",
): StoreSectionConfiguration | string {
  const where = `application "${applicationKey}", section "${section}"`;
  if (store !== "filesystem") {
    return `${where}: store "${store}" is not supported yet (filesystem only)`;
  }
  return {
    emulatedServerType: "filesystem",
    directory: sectionDirectory(environmentName, applicationKey, application, mode, section),
  };
}

/**
 * The Deployment configurations of every application installed in an environment.
 * `live` sections point at the application package's assets (edits become git diffs);
 * `copy` sections live in the environment state directory `.miroir/<environmentName>/`.
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
    const configuration: Record<string, StoreSectionConfiguration> = {};
    for (const section of ["admin", ...sectionsOf(application)] as const) {
      const override = section === "admin" ? undefined : application.sections?.[section];
      const mode = override?.mode ?? application.mode;
      const store = override?.store ?? application.store;
      if (mode === "live" && store !== "filesystem") {
        errors.push(`application "${applicationKey}", section "${section}": mode "live" needs store "filesystem", got "${store}"`);
        continue;
      }
      const result = sectionConfiguration(environmentName, applicationKey, application, mode, store, section);
      if (typeof result === "string") {
        errors.push(result);
        continue;
      }
      configuration[section] = result;
    }
    deployments.push({
      applicationKey,
      package: application.package,
      deployment: application.deployment,
      selfApplication: application.selfApplication,
      configuration: configuration as StoreUnitConfiguration,
    });
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

function environmentRuleErrors(name: string, environment: MiroirEnvironment): string[] {
  const errors: string[] = [];
  for (const required of REQUIRED_ENVIRONMENT_APPLICATIONS) {
    if (!environment.applications?.[required]) {
      errors.push(`environment "${name}" must install application "${required}"`);
    }
  }
  if (name.startsWith(TEST_ENVIRONMENT_PREFIX)) {
    for (const [applicationKey, application] of Object.entries(environment.applications ?? {})) {
      if (!application) {
        continue;
      }
      for (const section of ["admin", ...sectionsOf(application)] as const) {
        const override = section === "admin" ? undefined : application.sections?.[section];
        if ((override?.mode ?? application.mode) === "live") {
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
      errors: parsed.error.issues.map((issue) => `environment "${name}": ${issue.path.join(".") || "(root)"}: ${issue.message}`),
    };
  }

  const environment = merged as MiroirEnvironment;
  const errors = environmentRuleErrors(name, environment);
  return errors.length > 0 ? { status: "error", errors } : { status: "ok", chain, environment };
}
