import loglevelNextLog from "loglevelnext";
import {
  defaultMiroirModelEnvironment,
  type RestClientStub,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerFactoryInterface,
  type LoggerOptions,
} from "@miroir-framework/core";
import {
  bootEnvironment,
  environmentClientConfig,
  missingConnectionPasswords,
  resolveEnvironmentFromFiles,
  seedEnvironmentState,
  type ResolvedEnvironment,
} from "@miroir-framework/env";

import { startMiroirNode } from "miroir-localcache-redux/node";

import { loadStoreStartups } from "./startup/storeStartup.js";

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
  /** The emulated server and its entry point, for the authentication gate (#263). */
  serverDomainController?: DomainControllerInterface;
  restClientStub?: RestClientStub;
};

/**
 * #627: the commands come from the Endpoints of each deployed application's model, so every
 * application's persisted state is loaded into the local cache before the commands are built.
 */
async function loadDeployedApplications(
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  log: (line: string) => void,
): Promise<void> {
  for (const application of Object.keys(applicationDeploymentMap).sort()) {
    const result = await domainController.handleAction(
      {
        actionType: "rollback",
        actionLabel: `Load ${application} into the local cache`,
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: { application },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    if (result.status !== "ok") {
      log(`[miroir-cli] warning: could not load application ${application}: ${JSON.stringify(result)}`);
    }
  }
}

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

  const { domainController, emulatedServer } = await startMiroirNode(miroirConfig, {
    stores: await loadStoreStartups(miroirConfig),
    loggers: { factory: loglevelNextLog as any as LoggerFactoryInterface, options: loggerOptions },
  });
  const reconciliation = await bootEnvironment(domainController, environment, env);
  for (const warning of reconciliation.warnings) {
    log(`[miroir-cli] warning: ${warning}`);
  }
  await loadDeployedApplications(domainController, reconciliation.applicationDeploymentMap, log);
  return {
    environment,
    domainController,
    applicationDeploymentMap: reconciliation.applicationDeploymentMap,
    serverDomainController: emulatedServer?.domainController,
    restClientStub: emulatedServer?.restClientStub,
  };
}
