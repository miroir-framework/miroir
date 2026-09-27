#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import type { StoreSectionConfiguration } from "miroir-core";

import { EnvironmentError, resolveEnvironmentFromFiles, type ResolvedEnvironment } from "./environmentFiles.js";

// ################################################################################################
// miroir-env: show which environment a run uses and what it contains (#321).
// ################################################################################################

export type CliIo = {
  cwd: string;
  env: Record<string, string | undefined>;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
};

const USAGE = `Usage: miroir-env <command> [options]

Commands:
  show [--json] [--name <environment>]   print the resolved environment
`;

function describe(resolved: ResolvedEnvironment): string {
  const lines = [
    `environment ${resolved.name} (${resolved.source}), from ${resolved.files.join(" <- ")}`,
    `repository root ${resolved.repositoryRoot}`,
  ];
  if (resolved.environment.description) {
    lines.push(resolved.environment.description);
  }
  for (const deployment of resolved.deployments) {
    const application = resolved.environment.applications?.[deployment.applicationKey];
    lines.push("");
    lines.push(`${deployment.applicationKey}  deployment ${deployment.deployment}  ${application?.store} ${application?.mode}`);
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

export async function main(argv: string[], io: CliIo): Promise<number> {
  const [command, ...args] = argv;
  if (command !== "show") {
    io.stderr(USAGE);
    return command === undefined || command === "--help" || command === "-h" ? 0 : 2;
  }
  try {
    const resolved = resolveEnvironmentFromFiles({ cwd: io.cwd, name: option(args, "--name") });
    io.stdout(args.includes("--json") ? JSON.stringify(resolved, null, 2) + "\n" : describe(resolved));
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
