import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  deriveEnvironmentDeployments,
  resolveEnvironment,
  type EnvironmentDefinition,
  type EnvironmentDeployment,
  type MiroirEnvironment,
} from "miroir-core";

// ################################################################################################
// Environment definitions live in <repository root>/environments/<name>.json (#321).
// The repository root is found from the working directory, never from the location of the
// running bundle (bundlers relocate files, see #323).
// Selection, first match wins: --name, MIROIR_ENV, environments/local.json (personal, ignored by
// git), dev.
// ################################################################################################

export const ENVIRONMENTS_DIRECTORY = "environments";
export const DEFAULT_ENVIRONMENT = "dev";
export const LOCAL_ENVIRONMENT = "local";
export const ENVIRONMENT_VARIABLE = "MIROIR_ENV";

export class EnvironmentError extends Error {}

export type EnvironmentSelection = {
  name: string;
  /** Why this environment: "--name", "MIROIR_ENV", "environments/local.json" or "default". */
  source: string;
};

export type ResolvedEnvironment = EnvironmentSelection & {
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

/** True when a repository root with an environments/ folder is found above `cwd`. */
export function hasEnvironmentDefinitions(cwd: string): boolean {
  try {
    return existsSync(path.join(findRepositoryRoot(cwd), ENVIRONMENTS_DIRECTORY));
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

export function resolveEnvironmentFromFiles(options: {
  cwd: string;
  env: Record<string, string | undefined>;
  name?: string;
}): ResolvedEnvironment {
  const repositoryRoot = findRepositoryRoot(options.cwd);
  const selection = selectEnvironment(repositoryRoot, options);
  const resolution = resolveEnvironment(readEnvironmentDefinitions(repositoryRoot), selection.name);
  if (resolution.status === "error") {
    throw new EnvironmentError(resolution.errors.join("\n"));
  }
  const derived = deriveEnvironmentDeployments(resolution.environment, selection.name);
  if (derived.status === "error") {
    throw new EnvironmentError(derived.errors.map((error) => `environment "${selection.name}": ${error}`).join("\n"));
  }
  return {
    ...selection,
    repositoryRoot,
    files: resolution.chain.map(environmentFile),
    environment: resolution.environment,
    deployments: derived.deployments,
  };
}
