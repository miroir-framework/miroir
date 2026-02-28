#!/usr/bin/env node

import loglevelNextLog from 'loglevelnext';
import { Command, Option } from 'commander';
import {
  ApplicationDeploymentMap,
  DomainControllerInterface,
  miroirCoreStartup,
  MiroirActivityTracker,
  MiroirEventService,
  MiroirLoggerFactory,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  type LoggerFactoryInterface,
  type LoggerInterface,
  type LoggerOptions,
  type MiroirConfigClient,
} from 'miroir-core';

import { loadMiroirCliConfig } from './config/configLoader.js';
import { MiroirCliConfig } from './config/configSchema.js';
import { setupMiroirPlatform } from './startup/setup.js';
import { initializeStoreStartup } from './startup/storeStartup.js';
import {
  cliRequestHandlers,
  getAllCommands,
  type CliCommandHandler,
  type CliResult,
} from './commands/commandsFromEndpoint.js';

const packageName = "miroir-cli";
const version = "1.0.0";

let log: LoggerInterface = console as any as LoggerInterface;

const loglevelnext: LoggerFactoryInterface = loglevelNextLog as any as LoggerFactoryInterface;

const loggerOptions: LoggerOptions = {
  defaultLevel: "INFO",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: {},
};

// ################################################################################################
// Initialize Platform
// ################################################################################################

async function initializePlatform(
  config: MiroirCliConfig
): Promise<{
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
}> {
  // Initialize framework
  miroirCoreStartup();
  
  // Initialize stores based on configuration
  await initializeStoreStartup(config);

  // Setup MiroirContext
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  
  // Start loggers
  MiroirLoggerFactory.startRegisteredLoggers(
    miroirActivityTracker,
    miroirEventService,
    loglevelnext,
    loggerOptions,
  );

  MiroirLoggerFactory.registerLoggerToStart(
    MiroirLoggerFactory.getLoggerName(packageName, "info", "index")
  ).then((logger: LoggerInterface) => {
    log = logger;
  });

  const { domainController } = await setupMiroirPlatform(
    config as any as MiroirConfigClient,
    miroirActivityTracker,
    miroirEventService,
  );

  const applicationDeploymentMap = config.client.applicationDeploymentMap;

  if (!domainController) {
    throw new Error("Failed to initialize DomainController");
  }

  // Open stores for all configured deployments
  for (const [deploymentUuid, storeConfig] of Object.entries(
    config.client.deploymentStorageConfig
  )) {
    log.info(`Opening stores for deployment ${deploymentUuid}`);

    const openStoreAction: StoreOrBundleAction = {
      actionType: "storeManagementAction_openStore",
      actionLabel: `Open stores for ${deploymentUuid}`,      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      payload: {
        application: Object.keys(applicationDeploymentMap).find(
          (appUuid) => applicationDeploymentMap[appUuid] === deploymentUuid
        ) || "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        deploymentUuid: deploymentUuid,
        configuration: {
          [deploymentUuid]: storeConfig as StoreUnitConfiguration,
        },
      },
    };

    const result = await domainController.handleAction(
      openStoreAction,
      applicationDeploymentMap
    );

    if (result.status !== "ok") {
      throw new Error(
        `Failed to open stores for deployment ${deploymentUuid}: ${JSON.stringify(result)}`
      );
    }
  }

  return { domainController, applicationDeploymentMap };
}

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
          console.error(`Error: Either --payload or --file is required`);
          process.exit(1);
        }

        const result: CliResult = await execute(
          payload,
          domainController,
          applicationDeploymentMap
        );

        // Output result as JSON
        console.log(JSON.stringify(result, null, 2));

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
        console.error(JSON.stringify(errorResult, null, 2));
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
    '-c, --config <path>',
    'Path to configuration file (overrides MIROIR_CLI_CONFIG_PATH env var)'
  );

  // Parse global options first
  program.parse(process.argv);
  const globalOpts = program.opts();

  // Set config path from CLI option if provided
  if (globalOpts.config) {
    process.env.MIROIR_CLI_CONFIG_PATH = globalOpts.config;
  }

  // Load configuration
  let config: MiroirCliConfig;
  try {
    config = loadMiroirCliConfig();
  } catch (error) {
    console.error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Initialize platform
  let domainController: DomainControllerInterface;
  let applicationDeploymentMap: ApplicationDeploymentMap;
  
  try {
    const platform = await initializePlatform(config);
    domainController = platform.domainController;
    applicationDeploymentMap = platform.applicationDeploymentMap;
  } catch (error) {
    console.error(`Failed to initialize platform: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  // Create a new program instance for subcommands (after initialization)
  const cliProgram = new Command();
  
  cliProgram
    .name('miroir-cli')
    .version(version)
    .description('Command Line Interface for Miroir Framework - exposes Endpoint Actions as CLI commands');

  cliProgram.option(
    '-c, --config <path>',
    'Path to configuration file (overrides MIROIR_CLI_CONFIG_PATH env var)'
  );

  // Add list command to show available commands
  cliProgram
    .command('list')
    .description('List all available commands')
    .action(() => {
      const commands = getAllCommands();
      console.log('\nAvailable commands:\n');
      for (const handler of commands) {
        console.log(`  ${handler.commandDescription.name}`);
        console.log(`    ${handler.commandDescription.description}\n`);
      }
    });

  // Register all endpoint commands
  registerCommands(cliProgram, domainController, applicationDeploymentMap);

  // Parse and execute
  await cliProgram.parseAsync(process.argv);
}

// Run CLI
main().catch((error) => {
  console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
