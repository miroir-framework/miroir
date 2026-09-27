import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  deriveEnvironmentDeployments,
  miroirEnvironment,
  type EnvironmentDeployment,
  type MiroirEnvironment,
} from "miroir-core";

// ################################################################################################
// Environment definitions live in <repository root>/environments/<name>.json (#321).
// The repository root is found from the working directory, never from the location of the
// running bundle (bundlers relocate files, see #323).
// ################################################################################################

export const ENVIRONMENTS_DIRECTORY = "environments";
export const DEFAULT_ENVIRONMENT = "dev";

export class EnvironmentError extends Error {}

export type ResolvedEnvironment = {
  name: string;
  source: string;
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

function formatIssues(file: string, issues: { path: (string | number)[]; message: string }[]): string {
  return issues.map((issue) => `${file}: ${issue.path.join(".") || "(root)"}: ${issue.message}`).join("\n");
}

export function readEnvironmentFile(repositoryRoot: string, name: string): { file: string; environment: MiroirEnvironment } {
  const file = path.join(repositoryRoot, ENVIRONMENTS_DIRECTORY, `${name}.json`);
  if (!existsSync(file)) {
    throw new EnvironmentError(`environment "${name}" not found: ${file}`);
  }
  let content: unknown;
  try {
    content = JSON.parse(readFileSync(file, "utf-8"));
  } catch (error) {
    throw new EnvironmentError(`${file}: invalid JSON: ${(error as Error).message}`);
  }
  const parsed = miroirEnvironment.safeParse(content);
  if (!parsed.success) {
    throw new EnvironmentError(formatIssues(path.relative(repositoryRoot, file), parsed.error.issues));
  }
  return { file, environment: parsed.data };
}

export function resolveEnvironmentFromFiles(options: { cwd: string; name?: string }): ResolvedEnvironment {
  const repositoryRoot = findRepositoryRoot(options.cwd);
  const name = options.name ?? DEFAULT_ENVIRONMENT;
  const { file, environment } = readEnvironmentFile(repositoryRoot, name);
  const derived = deriveEnvironmentDeployments(environment, name);
  if (derived.status === "error") {
    throw new EnvironmentError(derived.errors.map((error) => `${path.relative(repositoryRoot, file)}: ${error}`).join("\n"));
  }
  return {
    name,
    source: options.name ? "argument" : "default",
    repositoryRoot,
    files: [path.relative(repositoryRoot, file)],
    environment,
    deployments: derived.deployments,
  };
}
