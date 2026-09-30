import loglevelNextLog from "loglevelnext";

import {
  ConfigurationService,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerFactoryInterface,
  type LoggerOptions,
} from "miroir-core";
import { bootEnvironment, openTestEnvironment, selectedTestEnvironment, type TestEnvironment } from "miroir-env";

import { setupMiroirPlatform } from "../../src/startup/setup.js";
import { initializeStoreStartup } from "../../src/startup/storeStartup.js";

// #345: the MCP integration tests run on a test environment (environments/test-*.json), like the
// standalone-app tests: MIROIR_ENV when it names one, else test-filesystem. Its filesystem copies in
// .miroir/<environment>/ are seeded again for each test file, so no test writes into tracked files.

export const DEFAULT_MCP_TEST_ENVIRONMENT = "test-filesystem";

export type McpTestPlatform = {
  environment: TestEnvironment;
  domainController: DomainControllerInterface;
  /** Every deployment the environment installs, and those found in its Admin data. */
  applicationDeploymentMap: ApplicationDeploymentMap;
};

export async function startMcpTestPlatform(
  expect: unknown,
  loggerOptions: LoggerOptions,
): Promise<McpTestPlatform> {
  const environment = openTestEnvironment(selectedTestEnvironment(process.env) ?? DEFAULT_MCP_TEST_ENVIRONMENT, {
    reseed: true,
  });
  for (const warning of environment.warnings) {
    console.warn(warning);
  }

  miroirCoreStartup();
  await initializeStoreStartup(environment.miroirConfig);
  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  MiroirLoggerFactory.startRegisteredLoggers(
    miroirActivityTracker,
    miroirEventService,
    loglevelNextLog as any as LoggerFactoryInterface,
    loggerOptions,
  );

  const { domainController } = await setupMiroirPlatform(
    environment.miroirConfig,
    miroirActivityTracker,
    miroirEventService,
  );
  const { applicationDeploymentMap } = await bootEnvironment(domainController, environment.resolved, process.env);
  return { environment, domainController, applicationDeploymentMap };
}
