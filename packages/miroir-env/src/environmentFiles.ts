import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  deriveEnvironmentDeployments,
  isTestEnvironment,
  resolveEnvironment,
  type EnvironmentDefinition,
  type EnvironmentDeployment,
  type MiroirEnvironment,
} from "miroir-core";

// ################################################################################################
// Environment definitions live in <repository root>/environments/<name>.json (#321).
// The repository root is found from the working directory, never from the location of the
// running bundle (bundlers relocate files, see #323). Outside a checkout (Docker's /data, packaged
// Electron's user data), MIROIR_ROOT names it (#345).
// Selection, first match wins: --name, MIROIR_ENV, environments/local.json (personal, ignored by
// git), dev.
// ################################################################################################

export const ENVIRONMENTS_DIRECTORY = "environments";
export const DEFAULT_ENVIRONMENT = "dev";
export const LOCAL_ENVIRONMENT = "local";
export const ENVIRONMENT_VARIABLE = "MIROIR_ENV";
export const ROOT_VARIABLE = "MIROIR_ROOT";
/**
 * #477: a parallel nonreg job (`run-nonreg.py --jobs`) names its worker, and a test environment
 * then keeps its state in `.miroir/<environment>@<worker>`, with stores named after that state.
 */
export const WORKER_VARIABLE = "MIROIR_TEST_WORKER";
const WORKER_NAME = /^w[0-9]+$/;

export class EnvironmentError extends Error {}

export type EnvironmentSelection = {
  name: string;
  /** Why this environment: "--name", "MIROIR_ENV", "environments/local.json" or "default". */
  source: string;
};

export type ResolvedEnvironment = EnvironmentSelection & {
  /**
   * What the environment's state and stores are named after: the environment name, or
   * `<name>@<worker>` for a test environment run by a nonreg worker (MIROIR_TEST_WORKER, #477).
   */
  stateName: string;
  repositoryRoot: string;
  files: string[];
  environment: MiroirEnvironment;
  deployments: EnvironmentDeployment[];
};

function isRepositoryRoot(directory: string): boolean {
  const packageJson = path.join(directory, "package.json");
  if (!existsSync(packageJson)) {
    return false;
  }
  try {
    return Array.isArray(JSON.parse(readFileSync(packageJson, "utf-8")).workspaces);
  } catch {
    return false;
  }
}

/** The closest ancestor of `start` (itself included) whose package.json declares workspaces. */
export function findRepositoryRoot(start: string): string {
  let directory = path.resolve(start);
  while (!isRepositoryRoot(directory)) {
    const parent = path.dirname(directory);
    if (parent === directory) {
      throw new EnvironmentError(`no repository root (a package.json with "workspaces") above ${start}`);
    }
    directory = parent;
  }
  return directory;
}

/**
 * The root of the environments: MIROIR_ROOT when set (a directory holding environments/ and the
 * package assets, outside a checkout), else the repository root above `cwd`.
 */
export function environmentRoot(cwd: string, env: Record<string, string | undefined> = {}): string {
  const root = env[ROOT_VARIABLE];
  return root ? path.resolve(cwd, root) : findRepositoryRoot(cwd);
}

/** True when an environments/ folder is found under MIROIR_ROOT, or in the repository root above `cwd`. */
export function hasEnvironmentDefinitions(cwd: string, env: Record<string, string | undefined> = {}): boolean {
  try {
    return existsSync(path.join(environmentRoot(cwd, env), ENVIRONMENTS_DIRECTORY));
  } catch (error) {
    if (error instanceof EnvironmentError) {
      return false;
    }
    throw error;
  }
}

function environmentsDirectory(repositoryRoot: string): string {
  return path.join(repositoryRoot, ENVIRONMENTS_DIRECTORY);
}

function environmentFile(name: string): string {
  return `${ENVIRONMENTS_DIRECTORY}/${name}.json`;
}

/** Every environments/<name>.json, parsed but not validated: a file may be a partial override. */
export function readEnvironmentDefinitions(repositoryRoot: string): Record<string, EnvironmentDefinition> {
  const directory = environmentsDirectory(repositoryRoot);
  if (!existsSync(directory)) {
    throw new EnvironmentError(`no environment definitions: ${directory} does not exist`);
  }
  const definitions: Record<string, EnvironmentDefinition> = {};
  for (const fileName of readdirSync(directory).filter((f) => f.endsWith(".json")).sort()) {
    const name = fileName.slice(0, -".json".length);
    let content: unknown;
    try {
      content = JSON.parse(readFileSync(path.join(directory, fileName), "utf-8"));
    } catch (error) {
      throw new EnvironmentError(`${environmentFile(name)}: invalid JSON: ${(error as Error).message}`);
    }
    if (typeof content !== "object" || content === null || Array.isArray(content)) {
      throw new EnvironmentError(`${environmentFile(name)}: an environment definition is a JSON object`);
    }
    const definition = content as EnvironmentDefinition;
    if (definition.extends !== undefined && typeof definition.extends !== "string") {
      throw new EnvironmentError(`${environmentFile(name)}: extends: the name of another environment is expected`);
    }
    definitions[name] = definition;
  }
  return definitions;
}

export function selectEnvironment(
  repositoryRoot: string,
  options: { name?: string; env: Record<string, string | undefined> },
): EnvironmentSelection {
  if (options.name) {
    return { name: options.name, source: "--name" };
  }
  const fromVariable = options.env[ENVIRONMENT_VARIABLE];
  if (fromVariable) {
    return { name: fromVariable, source: ENVIRONMENT_VARIABLE };
  }
  if (existsSync(path.join(environmentsDirectory(repositoryRoot), `${LOCAL_ENVIRONMENT}.json`))) {
    return { name: LOCAL_ENVIRONMENT, source: environmentFile(LOCAL_ENVIRONMENT) };
  }
  return { name: DEFAULT_ENVIRONMENT, source: "default" };
}

/** Resolves and derives every definition: the names that are valid, and the errors of the others. */
export function validateEnvironmentDefinitions(definitions: Record<string, EnvironmentDefinition>): {
  valid: string[];
  errors: string[];
} {
  const valid: string[] = [];
  const errors: string[] = [];
  for (const name of Object.keys(definitions).sort()) {
    const resolution = resolveEnvironment(definitions, name);
    if (resolution.status === "error") {
      errors.push(...resolution.errors);
      continue;
    }
    const derived = deriveEnvironmentDeployments(resolution.environment, name);
    if (derived.status === "error") {
      errors.push(...derived.errors.map((error) => `environment "${name}": ${error}`));
      continue;
    }
    valid.push(name);
  }
  return { valid, errors };
}

/**
 * The name the state of environment `name` goes by: `<name>@<worker>` when MIROIR_TEST_WORKER names a
 * worker and `name` is a test environment. Elsewhere the worker is ignored, and `warn` says so: a
 * variable left in a shell never moves a developer's data.
 */
export function environmentStateName(
  name: string,
  env: Record<string, string | undefined>,
  warn: (message: string) => void = console.warn,
): string {
  const worker = env[WORKER_VARIABLE];
  if (!worker) {
    return name;
  }
  if (!WORKER_NAME.test(worker)) {
    throw new EnvironmentError(`${WORKER_VARIABLE}=${worker}: a worker is named w<number>, e.g. w2`);
  }
  if (!isTestEnvironment(name)) {
    warn(`${WORKER_VARIABLE}=${worker} is ignored: environment ${name} is not a test environment (test-*)`);
    return name;
  }
  return `${name}@${worker}`;
}

export function resolveEnvironmentFromFiles(options: {
  cwd: string;
  env: Record<string, string | undefined>;
  name?: string;
  warn?: (message: string) => void;
}): ResolvedEnvironment {
  const repositoryRoot = environmentRoot(options.cwd, options.env);
  const selection = selectEnvironment(repositoryRoot, options);
  const resolution = resolveEnvironment(readEnvironmentDefinitions(repositoryRoot), selection.name);
  if (resolution.status === "error") {
    throw new EnvironmentError(resolution.errors.join("\n"));
  }
  const stateName = environmentStateName(selection.name, options.env, options.warn);
  const derived = deriveEnvironmentDeployments(resolution.environment, stateName);
  if (derived.status === "error") {
    throw new EnvironmentError(derived.errors.map((error) => `environment "${selection.name}": ${error}`).join("\n"));
  }
  return {
    ...selection,
    stateName,
    repositoryRoot,
    files: resolution.chain.map(environmentFile),
    environment: resolution.environment,
    deployments: derived.deployments,
  };
}
