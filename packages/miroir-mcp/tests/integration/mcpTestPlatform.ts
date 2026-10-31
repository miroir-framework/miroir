import loglevelNextLog from "loglevelnext";

import {
  ConfigurationService,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type MiroirConfigClient,
  type StoreSectionStartup,
  type StoreUnitConfiguration,
} from "miroir-core";
import { bootEnvironment, openTestEnvironment, selectedTestEnvironment, type TestEnvironment } from "miroir-env";

import { startMiroirNode } from "miroir-localcache-redux/node";

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

// dynamic imports: the indexedDb and postgres stores are optional peers, loaded only for their test environment
const storeStartups: Record<string, () => Promise<StoreSectionStartup>> = {
  filesystem: async () => (await import("miroir-store-filesystem")).miroirFileSystemStoreSectionStartup,
  indexedDb: async () => (await import("miroir-store-indexedDb")).miroirIndexedDbStoreSectionStartup,
  sql: async () => (await import("miroir-store-postgres")).miroirPostgresStoreSectionStartup,
};

/** The startups of the stores the test environment's emulated server uses. */
async function testEnvironmentStores(miroirConfig: MiroirConfigClient): Promise<StoreSectionStartup[]> {
  if (!miroirConfig.client.emulateServer) {
    return [];
  }
  const storeTypes = new Set<string>();
  for (const storeUnitConfiguration of Object.values(miroirConfig.client.deploymentStorageConfig) as StoreUnitConfiguration[]) {
    for (const section of Object.values(storeUnitConfiguration) as { emulatedServerType?: string }[]) {
      if (section?.emulatedServerType) {
        storeTypes.add(section.emulatedServerType);
      }
    }
  }
  return Promise.all([...storeTypes].map((storeType) => {
    const load = storeStartups[storeType];
    if (!load) {
      throw new Error(`mcpTestPlatform: no store startup for ${storeType}`);
    }
    return load();
  }));
}

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

  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });
  const { domainController } = await startMiroirNode(environment.miroirConfig, {
    stores: await testEnvironmentStores(environment.miroirConfig),
    loggers: { factory: loglevelNextLog as any as LoggerFactoryInterface, options: loggerOptions },
  });
  const { applicationDeploymentMap } = await bootEnvironment(domainController, environment.resolved, process.env);
  return { environment, domainController, applicationDeploymentMap };
}
