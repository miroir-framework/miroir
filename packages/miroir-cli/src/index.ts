#!/usr/bin/env node

import { Command } from 'commander';
import {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  type LoggerInterface,
} from '@miroir-framework/core';

import { authenticateCli, readPasswordFromTerminal } from './authentication.js';
import { initializePlatform } from './platform.js';
import { getAllCommands } from './commands/commandsFromEndpoint.js';
import { registerCatalogCommands } from './commands/registerCatalogCommands.js';

const version = "1.0.0";

const log: LoggerInterface = console as any as LoggerInterface;

// ################################################################################################
// #263: identity options, global to every command (docs/reference/authentication.md)
// ################################################################################################
function addAuthenticationOptions(program: Command): void {
  program.option('--token <bearer>', 'Bearer token of a platform user (default: MIROIR_AUTH_TOKEN)');
  program.option('--user <name>', 'Platform user to log in as; password from MIROIR_PASSWORD or a prompt');
  program.option('--disable-auth', 'Run without authentication (same hatch as the server)');
  program.option('--enable-auth', 'Require authentication (default)');
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
  addAuthenticationOptions(program);
  program.allowUnknownOption(true);
  program.helpOption(false);

  // Parse global options first
  program.parse(process.argv);
  const globalOpts = program.opts();
  const commandName = program.args[0];

  // Initialize platform on the selected environment
  let domainController: DomainControllerInterface;
  let applicationDeploymentMap: ApplicationDeploymentMap;

  try {
    const platform = await initializePlatform({ name: globalOpts.env });
    domainController = platform.domainController;
    applicationDeploymentMap = platform.applicationDeploymentMap;
    // #263: `list` and help read no application data; every other command needs identity when
    // authentication is on.
    if (commandName && commandName !== "list" && commandName !== "help") {
      const authentication = await authenticateCli({
        platform,
        argv: process.argv,
        env: process.env,
        options: { token: globalOpts.token, user: globalOpts.user },
        readPassword: readPasswordFromTerminal,
      });
      if (!authentication.ok) {
        const { ok: _ok, ...errorResult } = authentication;
        log.error(JSON.stringify({ ...errorResult, command: commandName }, null, 2));
        process.exit(1);
      }
    }
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
  addAuthenticationOptions(cliProgram);

  // Add list command to show available commands
  cliProgram
    .command('list')
    .description('List all available commands')
    .action(() => {
      log.debug('\nAvailable commands:\n');
      let applicationName: string | undefined;
      for (const handler of commands) {
        if (handler.entry.applicationName !== applicationName) {
          applicationName = handler.entry.applicationName;
          log.debug(`${applicationName}:`);
        }
        const alias = Object.entries(registration.aliases).find(([, name]) => name === handler.commandDescription.name)?.[0];
        log.debug(`  ${handler.commandDescription.name}${alias ? ` (alias: ${alias})` : ""}`);
        log.debug(`    ${handler.commandDescription.description}\n`);
      }
    });

  // #627: one command per Endpoint action of every deployed application
  const commands = getAllCommands(domainController, applicationDeploymentMap);
  const registration = registerCatalogCommands(cliProgram, commands, domainController, applicationDeploymentMap);

  // Parse and execute; open stores keep the event loop alive, so the CLI exits explicitly
  await cliProgram.parseAsync(process.argv);
  process.exit(process.exitCode ?? 0);
}

// Run CLI
main().catch((error) => {
  log.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
