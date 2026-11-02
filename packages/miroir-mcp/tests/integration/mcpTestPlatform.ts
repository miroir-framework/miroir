import loglevelNextLog from "loglevelnext";

import {
  localCacheKindFromEnvironment,
  startMiroirNodeWith,
  type LocalCacheModule,
  ConfigurationService,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerFactoryInterface,
  type LoggerOptions,
  type MiroirConfigClient,
  type StoreSectionStartup,
  type StoreUnitConfiguration,
} from "@miroir-framework/core";
import { bootEnvironment, openTestEnvironment, selectedTestEnvironment, type TestEnvironment } from "@miroir-framework/env";


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
  filesystem: async () => (await import("@miroir-framework/store-filesystem")).miroirFileSystemStoreSectionStartup,
  indexedDb: async () => (await import("@miroir-framework/store-indexeddb")).miroirIndexedDbStoreSectionStartup,
  sql: async () => (await import("@miroir-framework/store-postgres")).miroirPostgresStoreSectionStartup,
};

/**
 * The startups of the stores the test environment uses: the emulated server's, or those a
 * real-server client names (MIROIR_TEST_CLIENT=realServer), like the CLI's loader.
 */
async function testEnvironmentStores(miroirConfig: MiroirConfigClient): Promise<StoreSectionStartup[]> {
  const deployments: Record<string, StoreUnitConfiguration> = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig
    : (miroirConfig.client.serverConfig.storeSectionConfiguration ?? {});
  const storeTypes = new Set<string>();
  for (const storeUnitConfiguration of Object.values(deployments)) {
    for (const section of Object.values(storeUnitConfiguration) as { emulatedServerType?: string }[]) {
      if (section?.emulatedServerType) {
        storeTypes.add(section.emulatedServerType);
      }
    }
  }
  const startups: StoreSectionStartup[] = [];
  for (const storeType of storeTypes) {
    const load = storeStartups[storeType];
    if (!load) {
      console.warn(`[mcpTestPlatform] no store startup for ${storeType} - skipping`);
      continue;
    }
    startups.push(await load());
  }
  return startups;
}

// #656: the local cache MIROIR_TEST_LOCAL_CACHE names (run-nonreg.py --local-cache), redux when unset. From the
// caches' Node entries (test code): this package cannot depend on @miroir-framework/server, which depends on it.
async function testLocalCacheModule(): Promise<LocalCacheModule> {
  return localCacheKindFromEnvironment(process.env) === "zustand"
    ? (await import("miroir-localcache-zustand/node")).localCacheModule
    : (await import("miroir-localcache-redux/node")).localCacheModule;
}

/** #656: a platform built on another local cache than the one asked for would test the wrong one. */
function expectLocalCache(domainController: DomainControllerInterface): void {
  const expected = localCacheKindFromEnvironment(process.env);
  const actual = domainController.currentLocalCacheInfo().implementation;
  if (actual !== expected) {
    throw new Error(`test platform started on the ${actual} local cache, MIROIR_TEST_LOCAL_CACHE asks for ${expected}`);
  }
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
  const { domainController } = await startMiroirNodeWith(await testLocalCacheModule(), environment.miroirConfig, {
    stores: await testEnvironmentStores(environment.miroirConfig),
    loggers: { factory: loglevelNextLog as any as LoggerFactoryInterface, options: loggerOptions },
  });
  expectLocalCache(domainController);
  const { applicationDeploymentMap } = await bootEnvironment(domainController, environment.resolved, process.env);
  return { environment, domainController, applicationDeploymentMap };
}
