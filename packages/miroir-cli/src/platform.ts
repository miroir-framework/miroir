import loglevelNextLog from "loglevelnext";
import {
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerFactoryInterface,
  type LoggerOptions,
} from "miroir-core";
import {
  bootEnvironment,
  environmentClientConfig,
  missingConnectionPasswords,
  resolveEnvironmentFromFiles,
  seedEnvironmentState,
  type ResolvedEnvironment,
} from "miroir-env";

import { setupMiroirPlatform } from "./startup/setup.js";
import { initializeStoreStartup } from "./startup/storeStartup.js";

// ################################################################################################
// #345: the CLI runs on the selected environment (docs/reference/environments.md), first match
// wins: --env, MIROIR_ENV, environments/local.json, dev. It emulates the server in process on the
// environment's stores and opens every deployment the environment installs, like a server start.
// ################################################################################################

const loggerOptions: LoggerOptions = {
  defaultLevel: "INFO",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: {},
};

export type CliPlatform = {
  environment: ResolvedEnvironment;
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
};

export async function initializePlatform(
  options: { cwd?: string; env?: Record<string, string | undefined>; name?: string } = {},
  log: (line: string) => void = console.error,
): Promise<CliPlatform> {
  const env = options.env ?? process.env;
  const environment = resolveEnvironmentFromFiles({ cwd: options.cwd ?? process.cwd(), env, name: options.name });
  const source = environment.source === "--name" ? "--env" : environment.source;
  log(`[miroir-cli] environment: ${environment.name}, selected by ${source}, defined by ${environment.files.join(" <- ")}`);
  const seed = seedEnvironmentState(environment);
  if (seed.seeded.length > 0) {
    log(`[miroir-cli] environment state seeded from package assets: ${seed.seeded.join(", ")}`);
  }
  for (const warning of missingConnectionPasswords(environment, env)) {
    log(`[miroir-cli] warning: ${warning}`);
  }
  const miroirConfig = environmentClientConfig(environment, env);

  miroirCoreStartup();
  await initializeStoreStartup(miroirConfig);

  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  MiroirLoggerFactory.startRegisteredLoggers(
    miroirActivityTracker,
    miroirEventService,
    loglevelNextLog as any as LoggerFactoryInterface,
    loggerOptions,
  );

  const { domainController } = await setupMiroirPlatform(miroirConfig, miroirActivityTracker, miroirEventService);
  const reconciliation = await bootEnvironment(domainController, environment, env);
  for (const warning of reconciliation.warnings) {
    log(`[miroir-cli] warning: ${warning}`);
  }
  return { environment, domainController, applicationDeploymentMap: reconciliation.applicationDeploymentMap };
}
