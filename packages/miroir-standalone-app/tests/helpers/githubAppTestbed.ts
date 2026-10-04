/**
 * Shared boot for the GitHub example app tests (#472): an emulated-server session with
 * the GitHub deployment, its GitHubService Endpoint pointed at a local fake HTTP server.
 */
import { expect } from "vitest";
import type {
  ApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  EndpointDefinition,
  EntityInstance,
  LoggerOptions,
  MiroirConfigClient,
  MiroirConfigForClientStub,
  MiroirModelEnvironment,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
  ConfigurationService,
  createDeploymentCompositeAction,
  createExternalServiceTokenCache,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resetAndinitializeDeploymentCompositeAction,
  resetAndInitApplicationDeployment,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { deployment_Admin, deployment_Miroir } from "miroir-app-admin";
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-example-library";
import { defaultMiroirMetaModel } from "miroir-app-miroir";
import {
  defaultGitHubAppModel,
  deployment_GitHub_DO_NOT_USE,
  getDefaultGitHubModelEnvironment,
  githubInitApplicationVersion,
  githubServiceEndpoint,
  selfApplicationGitHub,
  selfApplicationModelBranchGitHubMasterBranch,
} from "miroir-example-github";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../../src/startup.js";
import { AppStackIntegrationTestSession } from "./IntegrationTestSession.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";
import {
  startFakeExternalServiceServer,
  type FakeExternalServiceServer,
} from "../utils/fakeExternalServiceServer.js";

export const GITHUB_DEPLOYMENT_UUID = "752c2412-a2cc-4632-94f3-937168969998";
export const GITHUB_APPLICATION_UUID = "6c4edcb2-e165-407a-b728-fbf8a18b6bf7";
export const GITHUB_ENDPOINT_UUID = "0c642e2a-3922-4ce7-99a6-88f91f6a103f";
export const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
export const ENTITY_MIROIR_SECRET_UUID = "a96856df-2b38-494a-8027-82617e2d64ad";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

export type GitHubTestbed = {
  miroirConfig: MiroirConfigClient;
  /** Client controller; in the emulated session it reaches the server through RestClientStub. */
  domainController: DomainControllerInterface;
  /** The emulated server's own controller (persistenceStoreAccessMode "local"). */
  domainControllerForServer: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  githubModelEnvironment: MiroirModelEnvironment;
  fakeServer: FakeExternalServiceServer;
  miroirActivityTracker: MiroirActivityTracker;
  miroirEventService: MiroirEventService;
};

const env: any = process.env;
const { miroirConfig, logConfig } = await loadTestConfigFiles(env);
if (!miroirConfig || !logConfig) {
  throw new Error("githubAppTestbed: test configuration is missing");
}
const loggerOptions: LoggerOptions = logConfig;

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirMongoDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({ expect: expect as any });

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);

export const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
  [selfApplicationGitHub.uuid]: deployment_GitHub_DO_NOT_USE.uuid,
};

const githubModelEnvironment = getDefaultGitHubModelEnvironment(
  defaultMiroirMetaModel,
  deployment_GitHub_DO_NOT_USE.uuid,
);

/** Boots the session, creates or opens the GitHub deployment. Call once per test file. */
export async function bootGitHubTestbed(): Promise<GitHubTestbed> {
  if (!miroirConfig.client.emulateServer) {
    throw new Error("GitHub app tests require emulateServer: true (in-process server path).");
  }
  const emulatedClient: MiroirConfigForClientStub = miroirConfig.client;
  const githubStorage: StoreUnitConfiguration | undefined =
    emulatedClient.deploymentStorageConfig[GITHUB_DEPLOYMENT_UUID];
  expect(githubStorage, "GitHub deployment must be in the test environment").toBeDefined();
  const adminDeployment: Deployment = {
    ...deployment_Admin,
    configuration: emulatedClient.deploymentStorageConfig[deployment_Admin.uuid],
  };

  const fakeServer = await startFakeExternalServiceServer();
  const session = new AppStackIntegrationTestSession(miroirConfig, {
    externalServiceEnvironment: {
      insecureBaseUrls: [fakeServer.baseUrl],
      tokenCache: createExternalServiceTokenCache(),
    },
    applicationDeploymentMap,
    adminDeployment,
    libraryDeploymentStorageConfiguration:
      emulatedClient.deploymentStorageConfig[deployment_Library_DO_NO_USE.uuid],
    miroirActivityTracker,
    miroirEventService,
  });
  const executionEnvironment = await session.initSession();
  const domainController = executionEnvironment.domainController;
  if (!executionEnvironment.domainControllerForServer) {
    throw new Error("GitHub app tests require the emulated-server DomainController.");
  }

  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
  ]);
  const createResult = await domainController.handleCompositeAction(
    createDeploymentCompositeAction(
      "GitHub",
      GITHUB_DEPLOYMENT_UUID,
      GITHUB_APPLICATION_UUID,
      adminDeployment,
      githubStorage as StoreUnitConfiguration,
    ),
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  if (createResult.status !== "ok") {
    const openResult = await domainController.handleAction(
      {
        actionType: "storeManagementAction_openStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        payload: {
          application: GITHUB_APPLICATION_UUID,
          deploymentUuid: GITHUB_DEPLOYMENT_UUID,
          configuration: { [GITHUB_DEPLOYMENT_UUID]: githubStorage },
        },
      },
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expect(openResult instanceof Action2Error, JSON.stringify(openResult)).toBe(false);
  }

  return {
    miroirConfig,
    domainController,
    domainControllerForServer: executionEnvironment.domainControllerForServer,
    applicationDeploymentMap,
    githubModelEnvironment,
    fakeServer,
    miroirActivityTracker,
    miroirEventService,
  };
}

/**
 * Reseeds the GitHub model and points GitHubService at `baseUrl`, the fake server by default.
 * Call before each test.
 */
export async function reseedGitHub(
  testbed: GitHubTestbed,
  baseUrl: string = testbed.fakeServer.baseUrl,
): Promise<void> {
  const { domainController } = testbed;
  const initResult = await domainController.handleCompositeAction(
    resetAndinitializeDeploymentCompositeAction(
      selfApplicationGitHub.uuid,
      deployment_GitHub_DO_NOT_USE.uuid,
      {
        dataStoreType: "app" as const,
        metaModel: defaultMiroirMetaModel,
        selfApplication: selfApplicationGitHub,
        applicationModelBranch: selfApplicationModelBranchGitHubMasterBranch as any,
        applicationVersion: githubInitApplicationVersion,
      },
      [],
      defaultGitHubAppModel,
    ),
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
    {},
  );
  expect(initResult.status, JSON.stringify(initResult)).toBe("ok");

  const existing = (githubServiceEndpoint as EndpointDefinition).definition as {
    externalService: Record<string, unknown>;
  };
  const updated = {
    ...githubServiceEndpoint,
    definition: { externalService: { ...existing.externalService, baseUrl } },
  } as EntityInstance;
  const updateResult = await domainController.handleAction(
    {
      actionType: "updateInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: selfApplicationGitHub.uuid,
        applicationSection: "model",
        objects: [updated],
      },
    },
    applicationDeploymentMap,
    githubModelEnvironment,
  );
  expect(updateResult instanceof Action2Error, JSON.stringify(updateResult)).toBe(false);
  const commitResult = await domainController.handleAction(
    {
      actionType: "commit",
      endpoint: MODEL_ENDPOINT,
      payload: { application: selfApplicationGitHub.uuid },
    },
    applicationDeploymentMap,
    githubModelEnvironment,
  );
  expect(commitResult instanceof Action2Error, JSON.stringify(commitResult)).toBe(false);
}

/** MiroirSecret rows, read on the server controller (the client path redacts ciphertext). */
export async function queryMiroirSecretRows(
  testbed: GitHubTestbed,
): Promise<Record<string, unknown>[]> {
  const queryResult = await testbed.domainControllerForServer.handleBoxedExtractorOrQueryAction(
    {
      actionType: "runBoxedQueryAction",
      endpoint: QUERY_ENDPOINT,
      payload: {
        application: ADMIN_APPLICATION_UUID,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          application: ADMIN_APPLICATION_UUID,
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          extractors: {
            secrets: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_SECRET_UUID,
            },
          },
        },
      },
    } as any,
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
  );
  expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
  const element = (queryResult as { returnedDomainElement?: { secrets?: unknown } })
    .returnedDomainElement?.secrets;
  if (Array.isArray(element)) {
    return element as Record<string, unknown>[];
  }
  return element && typeof element === "object"
    ? Object.values(element as Record<string, Record<string, unknown>>)
    : [];
}
