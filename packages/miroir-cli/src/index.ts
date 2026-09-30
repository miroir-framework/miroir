#!/usr/bin/env node

import { Command } from 'commander';
import {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  type LoggerInterface,
} from 'miroir-core';

import { initializePlatform } from './platform.js';
import {
  getAllCommands,
  type CliResult,
} from './commands/commandsFromEndpoint.js';

const version = "1.0.0";

const log: LoggerInterface = console as any as LoggerInterface;

// ################################################################################################
// Register Commands
// ################################################################################################

function registerCommands(
  program: Command,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
): void {
  const commands = getAllCommands();
  
  for (const handler of commands) {
    const { commandDescription, execute } = handler;
    
    const subcommand = program
      .command(commandDescription.name)
      .description(commandDescription.description);
    
    // Add --payload option for JSON input
    subcommand.option(
      '-p, --payload <json>',
      'JSON payload for the command (required)',
      undefined
    );

    // Add --file option to read payload from file
    subcommand.option(
      '-f, --file <path>',
      'Path to JSON file containing the payload',
      undefined
    );

    subcommand.action(async (options) => {
      try {
        let payload: unknown;

        if (options.file) {
          // Read payload from file
          const fs = await import('fs');
          const fileContent = fs.readFileSync(options.file, 'utf-8');
          payload = JSON.parse(fileContent);
        } else if (options.payload) {
          // Parse inline JSON payload
          payload = JSON.parse(options.payload);
        } else {
          log.error(`Error: Either --payload or --file is required`);
          process.exit(1);
        }

        const result: CliResult = await execute(
          payload,
          domainController,
          applicationDeploymentMap
        );

        // Output result as JSON
        log.debug(JSON.stringify(result, null, 2));

        // Exit with appropriate code
        if (result.status === "error") {
          process.exit(1);
        }
      } catch (error) {
        const errorResult: CliResult = {
          status: "error",
          command: commandDescription.name,
          error: {
            type: "cli_error",
            message: error instanceof Error ? error.message : String(error),
          },
        };
        log.error(JSON.stringify(errorResult, null, 2));
        process.exit(1);
      }
    });
  }
}

// ################################################################################################
// Main CLI Entry Point
// ################################################################################################

async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('miroir-cli')
    .version(version)
    .description('Command Line Interface for Miroir Framework - exposes Endpoint Actions as CLI commands');

  // Add global options
  program.option(
    '-e, --env <name>',
    'Environment to run on (environments/<name>.json); default: MIROIR_ENV, environments/local.json, then dev',
  );
  program.allowUnknownOption(true);
  program.helpOption(false);

  // Parse global options first
  program.parse(process.argv);
  const globalOpts = program.opts();

  // Initialize platform on the selected environment
  let domainController: DomainControllerInterface;
  let applicationDeploymentMap: ApplicationDeploymentMap;

  try {
    const platform = await initializePlatform({ name: globalOpts.env });
    domainController = platform.domainController;
    applicationDeploymentMap = platform.applicationDeploymentMap;
  } catch (error) {
    log.error(`Failed to initialize platform: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Create a new program instance for subcommands (after initialization)
  const cliProgram = new Command();
  
  cliProgram
    .name('miroir-cli')
    .version(version)
    .description('Command Line Interface for Miroir Framework - exposes Endpoint Actions as CLI commands');

  cliProgram.option(
    '-e, --env <name>',
    'Environment to run on (environments/<name>.json); default: MIROIR_ENV, environments/local.json, then dev',
  );

  // Add list command to show available commands
  cliProgram
    .command('list')
    .description('List all available commands')
    .action(() => {
      const commands = getAllCommands();
      log.debug('\nAvailable commands:\n');
      for (const handler of commands) {
        log.debug(`  ${handler.commandDescription.name}`);
        log.debug(`    ${handler.commandDescription.description}\n`);
      }
    });

  // Register all endpoint commands
  registerCommands(cliProgram, domainController, applicationDeploymentMap);

  // Parse and execute; open stores keep the event loop alive, so the CLI exits explicitly
  await cliProgram.parseAsync(process.argv);
  process.exit(0);
}

// Run CLI
main().catch((error) => {
  log.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
