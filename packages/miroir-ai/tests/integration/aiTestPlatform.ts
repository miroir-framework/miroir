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
  type ApplicationDeploymentMap,
  type DomainControllerInterface,
  type LoggerFactoryInterface,
  type LoggerOptions,
} from "miroir-core";
import { bootEnvironment, openTestEnvironment, selectedTestEnvironment } from "miroir-env";
import { RestPersistenceClientAndRestClient, setupMiroirDomainController } from "miroir-localcache-redux/node";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

export type AiTestPlatform = {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
};

const loggerOptions: LoggerOptions = {
  defaultLevel: "WARN",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: {},
};

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

  const client = new RestClientStub(miroirConfig.client.rootApiUrl);
  const domainController = await setupMiroirDomainController(miroirContext, {
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
  const domainControllerForServer = await setupMiroirDomainController(miroirContext, {
    persistenceStoreAccessMode: "local",
    localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer,
  });
  client.setServerDomainController(domainControllerForServer);
  client.setPersistenceStoreControllerManager(persistenceStoreControllerManagerForServer);

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
