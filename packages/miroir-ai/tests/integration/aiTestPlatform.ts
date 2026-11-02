// #627: boots a test environment (environments/test-*.json, test-filesystem by default) with an
// emulated server, as miroir-mcp's mcpTestPlatform does, for the CopilotKit integration tests.
import loglevelNextLog from "loglevelnext";

import {
  ConfigurationService,
  MiroirActivityTracker,
  MiroirContext,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerManager,
  RestClientStub,
  defaultMiroirModelEnvironment,
  localCacheKindFromEnvironment,
  type LocalCacheModule,
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerFactoryInterface,
  type LoggerOptions,
} from "@miroir-framework/core";
import { bootEnvironment, openTestEnvironment, selectedTestEnvironment } from "@miroir-framework/env";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";

export type AiTestPlatform = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
};

const loggerOptions: LoggerOptions = {
  defaultLevel: "WARN",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: {},
};

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

export async function startAiTestPlatform(expect: unknown): Promise<AiTestPlatform> {
  const environment = openTestEnvironment(selectedTestEnvironment(process.env) ?? "test-filesystem", { reseed: true });
  const miroirConfig = environment.miroirConfig;
  if (!miroirConfig.client.emulateServer) {
    throw new Error("startAiTestPlatform needs an emulated-server test environment");
  }

  miroirCoreStartup();
  miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  MiroirLoggerFactory.startRegisteredLoggers(
    miroirActivityTracker,
    miroirEventService,
    loglevelNextLog as any as LoggerFactoryInterface,
    loggerOptions,
  );
  const miroirContext = new MiroirContext(miroirActivityTracker, miroirEventService, miroirConfig);

  const { setupMiroirDomainController, RestPersistenceClientAndRestClient } = await testLocalCacheModule();
  const client = new RestClientStub(miroirConfig.client.rootApiUrl);
  const domainController = setupMiroirDomainController(miroirContext, {
    persistenceStoreAccessMode: "remote",
    localPersistenceStoreControllerManager: new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
    ),
    remotePersistenceStoreRestClient: new RestPersistenceClientAndRestClient(miroirConfig.client.rootApiUrl, client),
  });
  const persistenceStoreControllerManagerForServer = new PersistenceStoreControllerManager(
    ConfigurationService.configurationService.adminStoreFactoryRegister,
    ConfigurationService.configurationService.StoreSectionFactoryRegister,
    miroirConfig.client.filesystemDeploymentRootDirectory,
  );
  const domainControllerForServer = setupMiroirDomainController(miroirContext, {
    persistenceStoreAccessMode: "local",
    localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer,
  });
  client.setServerDomainController(domainControllerForServer);
  client.setPersistenceStoreControllerManager(persistenceStoreControllerManagerForServer);
  expectLocalCache(domainController);
  expectLocalCache(domainControllerForServer);

  const { applicationDeploymentMap } = await bootEnvironment(domainController, environment.resolved, process.env);
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
      throw new Error(`startAiTestPlatform: could not load ${application}: ${JSON.stringify(result)}`);
    }
  }
  return { domainController, applicationDeploymentMap };
}
