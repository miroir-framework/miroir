import { Command } from "commander";
import {
  MiroirLoggerFactory,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerInterface,
} from "miroir-core";

import {
  cliCommandAliases,
  RESERVED_CLI_COMMAND_NAMES,
  type CliCommandHandler,
  type CliResult,
} from "./commandsFromEndpoint.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName("miroir-cli", "info", "registerCatalogCommands");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

export type CatalogCommandRegistration = {
  /** Command names registered on the program. */
  registered: string[];
  /** alias -> command name */
  aliases: Record<string, string>;
  /** Commands commander refused, with the reason. */
  skipped: { name: string; reason: string }[];
};

async function readPayload(options: { file?: string; payload?: string }): Promise<unknown> {
  if (options.file) {
    const fs = await import("fs");
    return JSON.parse(fs.readFileSync(options.file, "utf-8"));
  }
  if (options.payload) {
    return JSON.parse(options.payload);
  }
  throw new Error("Either --payload or --file is required");
}

/**
 * Registers one `commander` command per catalog command, with the aliases of `cliCommandAliases`.
 * A command commander refuses (a name already taken) is skipped and reported, not thrown. Command
 * actions print their result and set `process.exitCode`; only the entry point exits.
 */
export function registerCatalogCommands(
  program: Command,
  handlers: CliCommandHandler<any>[],
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): CatalogCommandRegistration {
  const aliasOf = cliCommandAliases(handlers);
  const aliasByCommand = Object.fromEntries(Object.entries(aliasOf).map(([alias, name]) => [name, alias]));
  const registration: CatalogCommandRegistration = { registered: [], aliases: {}, skipped: [] };
  const taken = new Set<string>([
    ...RESERVED_CLI_COMMAND_NAMES,
    ...program.commands.flatMap((command) => [command.name(), ...command.aliases()]),
  ]);

  for (const handler of handlers) {
    const { commandDescription, execute } = handler;
    if (taken.has(commandDescription.name)) {
      registration.skipped.push({ name: commandDescription.name, reason: "name already taken" });
      log.warn(`registerCatalogCommands: skipping ${commandDescription.name}: name already taken`);
      continue;
    }
    let subcommand: Command;
    try {
      subcommand = program.command(commandDescription.name).description(commandDescription.description);
      const alias = aliasByCommand[commandDescription.name];
      if (alias && !taken.has(alias)) {
        subcommand.alias(alias);
        taken.add(alias);
        registration.aliases[alias] = commandDescription.name;
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      registration.skipped.push({ name: commandDescription.name, reason });
      log.warn(`registerCatalogCommands: skipping ${commandDescription.name}: ${reason}`);
      continue;
    }
    taken.add(commandDescription.name);
    registration.registered.push(commandDescription.name);

    subcommand.option("-p, --payload <json>", "JSON payload for the command (required)", undefined);
    subcommand.option("-f, --file <path>", "Path to JSON file containing the payload", undefined);
    subcommand.action(async (options) => {
      let result: CliResult;
      try {
        result = await execute(await readPayload(options), domainController, applicationDeploymentMap);
      } catch (error) {
        result = {
          status: "error",
          command: commandDescription.name,
          error: { type: "cli_error", message: error instanceof Error ? error.message : String(error) },
        };
      }
      if (result.status === "error") {
        process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = 1;
        return;
      }
      // the command's output, not a log line
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });
  }
  return registration;
}
