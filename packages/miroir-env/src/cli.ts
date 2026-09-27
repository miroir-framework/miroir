#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import type { StoreSectionConfiguration } from "miroir-core";

import {
  EnvironmentError,
  findRepositoryRoot,
  readEnvironmentDefinitions,
  resolveEnvironmentFromFiles,
  validateEnvironmentDefinitions,
  type ResolvedEnvironment,
} from "./environmentFiles.js";
import { describeEnvironmentStateStatus, environmentStateStatus, missingConnectionPasswords } from "./environmentState.js";
import { importExtras, inspectEnvironmentState, pruneExtras } from "./stateCommands.js";
import { changedAssetFiles } from "./trackedAssets.js";

// ################################################################################################
// miroir-env: show which environment a run uses and what it contains, check its state against
// its definition, record or remove what the definition does not install (#321).
// ################################################################################################

export type CliIo = {
  cwd: string;
  env: Record<string, string | undefined>;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

const USAGE = `Usage: miroir-env <command> [options]

Commands:
  show [--json]                     print the resolved environment and where its state stands
  check [--strict] [--tracked-clean]
                                    validate every definition, compare the state with the
                                    selected one; --strict (or CI set) turns warnings into
                                    errors; --tracked-clean fails when asset files changed
  import [--dry-run]                record the deployments of the state that the definition
                                    does not install in environments/local.json
  prune [--dry-run]                 delete those deployments and their stores in the state
                                    (stop the server first)

Every command takes --name <environment>. Environment selection, first match wins: --name,
MIROIR_ENV, environments/local.json, dev.
`;

const COMMANDS = ["show", "check", "import", "prune"];

function describe(resolved: ResolvedEnvironment): string {
  const lines = [
    `environment ${resolved.name}, selected by ${resolved.source}, defined by ${resolved.files.join(" <- ")}`,
    `repository root ${resolved.repositoryRoot}`,
  ];
  if (resolved.environment.description) {
    lines.push(resolved.environment.description);
  }
  lines.push(describeEnvironmentStateStatus(environmentStateStatus(resolved)));
  for (const deployment of resolved.deployments) {
    const application = resolved.environment.applications?.[deployment.applicationKey];
    const stores = application?.configuration ? "given configuration" : `${application?.store} ${application?.mode}`;
    lines.push("");
    lines.push(`${deployment.applicationKey}  deployment ${deployment.deployment}  ${stores}`);
    for (const [section, configuration] of Object.entries(deployment.configuration) as [string, StoreSectionConfiguration][]) {
      const where = "directory" in configuration ? configuration.directory : JSON.stringify(configuration);
      lines.push(`  ${section.padEnd(12)} ${where}`);
    }
  }
  return lines.join("\n") + "\n";
}

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function isCi(env: Record<string, string | undefined>): boolean {
  return env.CI !== undefined && env.CI !== "" && env.CI !== "false" && env.CI !== "0";
}

/** Exit code 1 when an error is found: invalid definition, warning under --strict, changed asset file. */
function check(args: string[], io: CliIo): number {
  const strict = args.includes("--strict") || isCi(io.env);
  const lines: string[] = [];
  let errors = 0;
  const report = (level: "info" | "warning" | "error", message: string) => {
    const shown = level === "warning" && strict ? "error" : level;
    errors += shown === "error" ? 1 : 0;
    lines.push(`${shown}: ${message}`);
  };

  const repositoryRoot = findRepositoryRoot(io.cwd);
  const definitions = readEnvironmentDefinitions(repositoryRoot);
  const validation = validateEnvironmentDefinitions(definitions);
  let resolved: ResolvedEnvironment | undefined;
  try {
    resolved = resolveEnvironmentFromFiles({ cwd: io.cwd, env: io.env, name: option(args, "--name") });
  } catch (error) {
    if (!(error instanceof EnvironmentError)) {
      throw error;
    }
    if (!validation.errors.some((validationError) => error.message.includes(validationError))) {
      report("error", error.message);
    }
  }
  if (resolved) {
    lines.push(`environment ${resolved.name}, selected by ${resolved.source}, defined by ${resolved.files.join(" <- ")}`);
  }
  lines.push(`definitions: ${validation.valid.length > 0 ? `${validation.valid.join(", ")} valid` : "none valid"}`);
  validation.errors.forEach((error) => report("error", error));
  if (resolved) {
    lines.push(describeEnvironmentStateStatus(environmentStateStatus(resolved)));
    for (const finding of inspectEnvironmentState(resolved, definitions).findings) {
      report(finding.level, finding.message);
    }
    missingConnectionPasswords(resolved, io.env).forEach((warning) => report("warning", warning));
  }
  if (args.includes("--tracked-clean")) {
    try {
      const changed = changedAssetFiles(repositoryRoot);
      changed.forEach((file) => report("error", `asset file changed: ${file}`));
      if (changed.length === 0) {
        lines.push("tracked assets: clean");
      }
    } catch (error) {
      if (!(error instanceof EnvironmentError)) {
        throw error;
      }
      report("error", error.message);
    }
  }
  lines.push(`check: ${errors === 0 ? "ok" : `${errors} error${errors > 1 ? "s" : ""}`}${strict ? " (strict)" : ""}`);
  io.stdout(lines.join("\n") + "\n");
  return errors === 0 ? 0 : 1;
}

export async function main(argv: string[], io: CliIo): Promise<number> {
  const [command, ...args] = argv;
  if (!COMMANDS.includes(command)) {
    io.stderr(USAGE);
    return command === undefined || command === "--help" || command === "-h" ? 0 : 2;
  }
  try {
    if (command === "check") {
      return check(args, io);
    }
    const resolved = resolveEnvironmentFromFiles({ cwd: io.cwd, env: io.env, name: option(args, "--name") });
    if (command === "show") {
      io.stdout(args.includes("--json") ? JSON.stringify(resolved, null, 2) + "\n" : describe(resolved));
      return 0;
    }
    const definitions = readEnvironmentDefinitions(resolved.repositoryRoot);
    const dryRun = args.includes("--dry-run");
    const lines =
      command === "import"
        ? importExtras(resolved, definitions, { dryRun, env: io.env })
        : pruneExtras(resolved, definitions, { dryRun });
    io.stdout(lines.join("\n") + "\n");
    return 0;
  } catch (error) {
    if (error instanceof EnvironmentError) {
      io.stderr(`miroir-env: ${error.message}\n`);
      return 2;
    }
    throw error;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2), {
    cwd: process.cwd(),
    env: process.env,
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  }).then((code) => process.exit(code));
}
