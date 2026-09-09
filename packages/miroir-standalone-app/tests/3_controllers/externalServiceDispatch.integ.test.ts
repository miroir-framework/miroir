/**
 * External service dispatch seam — Dispatch seam: extractor restriction (D6), closed switches,
 * composite invocation (Goal 5), client-side hard errors (D5).
 *
 * Run:
 * ```bash
 * RUN_TEST=externalServiceDispatch npm run testByFile -w miroir-standalone-app -- externalServiceDispatch --profile emulatedServer-filesystem
 * ```
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type {
  ApplicationDeploymentMap,
  Deployment,
  EndpointDefinition,
  EntityInstance,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
  allowInsecureBaseUrlsForTests,
  asyncInnerSelectElementFromQuery,
  clearAllowedInsecureBaseUrlsForTests,
  clearSecrets,
  ConfigurationService,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  DomainControllerInterface,
  ExtractorRunnerInMemory,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  registerSecrets,
  resetAndInitApplicationDeployment,
  resetIntegTestbed,
  resolveExtractorTemplate,
  runQuery,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { FileSystemExtractorRunner } from "../../../miroir-store-filesystem/src/4_services/FileSystemExtractorRunner.js";
import { sqlStringForExtractor } from "../../../miroir-store-postgres/src/1_core/SqlGenerator.js";
import { MixedSqlDbInstanceStoreSection } from "../../../miroir-store-postgres/src/4_services/sqlDbInstanceStoreSectionMixin.js";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { deployment_Admin, deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  deployment_Library_DO_NO_USE,
  endpointDocument,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { selfApplicationDeploymentConfigurationsTO_REMOVE } from "../../src/miroir-fwk/4-tests/tests-utils.js";
import { miroirAppStartup } from "../../src/startup.js";
import { cleanLevel, packageName } from "./constants.js";
import { AppStackIntegrationTestSession } from "../helpers/IntegrationTestSession.js";
import {
  libraryEntitiesAndInstances,
  libraryTestbedInitParams,
} from "../helpers/libraryPlayfieldSeeds.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";
import {
  startFakeExternalServiceServer,
  type FakeExternalServiceServer,
} from "../utils/fakeExternalServiceServer.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "externalServiceDispatch" ||
  RUN_TEST === "externalServiceDispatch.integ.test";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const PLAYLIST_OK = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "playlist-ok.json"), "utf8"),
) as { name: string; tracks: { total: number } };

const PLAYLIST_NAME_LITERAL = "Rock Classics";
const PLAYLIST_ID_OK = "test-playlist-001";
const TEST_ENDPOINT_UUID = "c8f2a1b4-6d3e-4a91-9b07-2e5c8d1f4a63";
const LENDING_ENDPOINT_UUID = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";
const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";

const PLAYLIST_RESPONSE_SCHEMA = {
  type: "object",
  definition: {
    name: { type: "string" },
    tracks: {
      type: "object",
      definition: {
        total: { type: "number" },
      },
    },
  },
};

const env: any = process.env;
const { miroirConfig, logConfig: importedLoggerOptions } = await loadTestConfigFiles(env);
if (!miroirConfig) {
  throw new Error("miroirConfig is undefined");
}
if (!importedLoggerOptions) {
  throw new Error("importedLoggerOptions is undefined");
}
const loggerOptions: LoggerOptions = importedLoggerOptions;
const fileName = "externalServiceDispatch.integ.test";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

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

const testApplicationDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client
  .emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client
  .emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Admin.uuid];

const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: adminDeploymentStorageConfiguration,
};

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
};

const defaultLibraryModelEnvironment = getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  endpointDocument as EndpointDefinition,
  deployment_Library_DO_NO_USE.uuid,
);

let domainController: DomainControllerInterface;
let serverDomainController: DomainControllerInterface;
let fakeServer: FakeExternalServiceServer;

function testEndpointInstance(baseUrl: string): EndpointDefinition {
  return {
    uuid: TEST_ENDPOINT_UUID,
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: selfApplicationLibrary.uuid,
    name: "FakeSpotifySlice4",
    version: "1",
    description: "Slice 4 dispatch endpoint — GET playlist + POST create-playlist",
    definition: {
      externalService: {
        openApiDocument:
          '{"openapi":"3.0.0","info":{"title":"FakeSpotify","version":"1.0.0"},"paths":{}}',
        baseUrl,
        securityScheme: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        credentialKey: "fakeSpotify",
        enabledOperations: ["get-playlist", "create-playlist"],
        operations: [
          {
            operationId: "get-playlist",
            method: "GET",
            path: "/playlists/{playlist_id}",
            parameterMappings: [{ name: "playlist_id", in: "path", required: true }],
            responseSchema: PLAYLIST_RESPONSE_SCHEMA,
          },
          {
            operationId: "create-playlist",
            method: "POST",
            path: "/playlists",
            parameterMappings: [],
            responseSchema: PLAYLIST_RESPONSE_SCHEMA,
          },
        ],
      },
    },
  } as EndpointDefinition;
}

function boxedFromActionQuery(
  endpointUuid: string,
  actionType: string,
  parameterBindings: Record<string, unknown>,
  extras?: { runAsSql?: boolean },
) {
  return {
    actionType: "runBoxedQueryAction" as const,
    endpoint: QUERY_ENDPOINT,
    payload: {
      application: selfApplicationLibrary.uuid,
      applicationSection: "data" as const,
      queryExecutionStrategy: "storage" as const,
      query: {
        queryType: "boxedQueryWithExtractorCombinerTransformer" as const,
        application: selfApplicationLibrary.uuid,
        ...(extras?.runAsSql ? { runAsSql: true } : {}),
        extractors: {
          playlist: {
            extractorOrCombinerType: "extractorFromAction",
            endpointUuid,
            actionType,
            parameterBindings,
          },
        },
      },
    },
  };
}

function expectActionError(
  result: unknown,
  messagePattern?: RegExp,
  errorType?: string,
): Action2Error {
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
  const error = result as Action2Error;
  if (errorType) {
    expect(error.errorType).toBe(errorType);
  }
  if (messagePattern) {
    expect(error.errorMessage ?? "").toMatch(messagePattern);
  }
  return error;
}

async function commitTestEndpoint(): Promise<void> {
  const createResult = await domainController.handleAction(
    {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "model",
        objects: [testEndpointInstance(fakeServer.baseUrl) as EntityInstance],
      },
    },
    applicationDeploymentMap,
    defaultLibraryModelEnvironment,
  );
  expect(createResult instanceof Action2Error, `createInstance failed: ${JSON.stringify(createResult)}`).toBe(
    false,
  );

  const commitResult = await domainController.handleAction(
    {
      actionType: "commit",
      endpoint: MODEL_ENDPOINT,
      payload: { application: selfApplicationLibrary.uuid },
    },
    applicationDeploymentMap,
    defaultLibraryModelEnvironment,
  );
  expect(commitResult instanceof Action2Error, `commit failed: ${JSON.stringify(commitResult)}`).toBe(
    false,
  );
}

beforeAll(async () => {
  if (!miroirConfig.client.emulateServer) {
    throw new Error(
      "externalServiceDispatch requires emulateServer: true (in-process server path).",
    );
  }

  fakeServer = await startFakeExternalServiceServer({
    [`GET /playlists/${PLAYLIST_ID_OK}`]: { body: PLAYLIST_OK },
    [`POST /playlists`]: { body: PLAYLIST_OK },
  });
  registerSecrets({ fakeSpotify: "test-token" });
  allowInsecureBaseUrlsForTests([fakeServer.baseUrl]);

  const session = new AppStackIntegrationTestSession(miroirConfig, {
    applicationDeploymentMap,
    adminDeployment,
    libraryDeploymentStorageConfiguration,
    miroirActivityTracker,
    miroirEventService,
  });
  const executionEnvironment = await session.initSession();
  domainController = executionEnvironment.domainController;
  if (!executionEnvironment.domainControllerForServer) {
    throw new Error(
      "externalServiceDispatch Cycle 3 requires the emulated-server DomainController (persistenceStoreAccessMode === local).",
    );
  }
  serverDomainController = executionEnvironment.domainControllerForServer;

  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
  ]);
  await resetIntegTestbed({
    domainController,
    applicationDeploymentMap,
    libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
    librarySelfApplicationUuid: selfApplicationLibrary.uuid,
    deploymentsToReset: selfApplicationDeploymentConfigurationsTO_REMOVE,
    testbedEntitiesAndInstances: libraryEntitiesAndInstances,
    testbedInitApplicationParameters: libraryTestbedInitParams,
    testbedModel: defaultLibraryModelEnvironment.currentModel as any,
  });
  await commitTestEndpoint();
}, 120000);

beforeEach(() => {
  fakeServer.receivedRequests.length = 0;
});

afterAll(async () => {
  clearSecrets();
  clearAllowedInsecureBaseUrlsForTests();
  if (fakeServer) {
    await fakeServer.close();
  }
});

describe.skipIf(!shouldRun).sequential("externalServiceDispatch — Cycle 1 extractor restriction (D6)", () => {
  it("extractorFromAction targeting Library lendDocument (actions-branch) is a hard Action2Error", async () => {
    const result = await domainController.handleBoxedExtractorOrQueryAction(
      boxedFromActionQuery(LENDING_ENDPOINT_UUID, "lendDocument", {
        user: "31f3a03a-f150-416d-9315-d3a752cb4eb4",
        book: "c1c97d54-aba8-4599-883a-7fe8f3874095",
      }) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expectActionError(result, /external.?service|GET|restricted|not an external/i);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });

  it("extractorFromAction targeting a non-GET (POST) operation is a hard Action2Error", async () => {
    const result = await domainController.handleBoxedExtractorOrQueryAction(
      boxedFromActionQuery(TEST_ENDPOINT_UUID, "create-playlist", {}) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expectActionError(result, /GET|restricted|not a GET|method/i);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });
});

function extractorFromActionLiteral() {
  return {
    extractorOrCombinerType: "extractorFromAction" as const,
    endpointUuid: TEST_ENDPOINT_UUID,
    actionType: "get-playlist",
    parameterBindings: { playlist_id: PLAYLIST_ID_OK },
  };
}

function namesExtractorFromAction(text: string): void {
  expect(text).toMatch(/extractorFromAction/);
}

async function expectNamedExtractorFromActionFailure(
  run: () => unknown | Promise<unknown>,
): Promise<void> {
  try {
    const result = await run();
    if (result instanceof Domain2ElementFailed) {
      namesExtractorFromAction(
        `${result.failureMessage ?? ""} ${result.query ?? ""} ${JSON.stringify(result)}`,
      );
      return;
    }
    if (result instanceof Action2Error) {
      namesExtractorFromAction(result.errorMessage ?? JSON.stringify(result));
      return;
    }
    expect.fail(`expected a failure naming extractorFromAction, got ${JSON.stringify(result)}`);
  } catch (error) {
    namesExtractorFromAction(error instanceof Error ? error.message : String(error));
  }
}

describe.skipIf(!shouldRun).sequential("externalServiceDispatch — Cycle 2 closed switches name extractorFromAction", () => {
  it("QuerySelectors.runQuery names extractorFromAction", async () => {
    await expectNamedExtractorFromActionFailure(() =>
      runQuery(
        {},
        applicationDeploymentMap,
        {
          extractor: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: selfApplicationLibrary.uuid,
            extractors: { playlist: extractorFromActionLiteral() },
          },
        } as any,
        defaultMiroirModelEnvironment,
      ),
    );
  });

  it("AsyncQuerySelectors.asyncInnerSelectElementFromQuery names extractorFromAction", async () => {
    await expectNamedExtractorFromActionFailure(() =>
      asyncInnerSelectElementFromQuery(
        {},
        {},
        defaultMiroirModelEnvironment,
        {},
        {} as any,
        selfApplicationLibrary.uuid,
        applicationDeploymentMap,
        {},
        extractorFromActionLiteral() as any,
      ),
    );
  });

  it("ExtractorRunnerInMemory.extractEntityInstance names extractorFromAction", async () => {
    const runner = new ExtractorRunnerInMemory({ getStoreName: () => "phase4-inmemory" } as any);
    await expectNamedExtractorFromActionFailure(() =>
      runner.extractEntityInstance(
        {
          extractor: {
            queryType: "boxedExtractorOrCombinerReturningObject",
            application: selfApplicationLibrary.uuid,
            select: extractorFromActionLiteral() as any,
          },
        } as any,
        applicationDeploymentMap,
        defaultMiroirModelEnvironment,
      ),
    );
  });

  it("FileSystemExtractorRunner.extractEntityInstance names extractorFromAction", async () => {
    const runner = new FileSystemExtractorRunner({ getStoreName: () => "phase4-fs" } as any);
    await expectNamedExtractorFromActionFailure(() =>
      runner.extractEntityInstance({
        extractor: {
          queryType: "boxedExtractorOrCombinerReturningObject",
          application: selfApplicationLibrary.uuid,
          select: extractorFromActionLiteral() as any,
        },
      } as any),
    );
  });

  it("SqlGenerator.sqlStringForExtractor names extractorFromAction", async () => {
    await expectNamedExtractorFromActionFailure(() =>
      sqlStringForExtractor(
        extractorFromActionLiteral() as any,
        "public",
        defaultMiroirModelEnvironment,
      ),
    );
  });

  it("sqlDbInstanceStoreSectionMixin.sqlForQuery names extractorFromAction", async () => {
    const section = new MixedSqlDbInstanceStoreSection(
      "data",
      "phase4-sql",
      "postgres://127.0.0.1:1/phase4",
      "public",
      "phase4-sqlForQuery",
    );
    try {
      await expectNamedExtractorFromActionFailure(() =>
        section.sqlForQuery(
          {
            queryType: "boxedExtractorOrCombinerReturningObject",
            application: selfApplicationLibrary.uuid,
            select: extractorFromActionLiteral() as any,
          } as any,
          defaultMiroirModelEnvironment,
        ),
      );
    } finally {
      await (section as { close?: () => Promise<unknown> }).close?.();
    }
  });

  it("Templates.resolveExtractorTemplate names extractorFromAction", async () => {
    await expectNamedExtractorFromActionFailure(() =>
      resolveExtractorTemplate(
        extractorFromActionLiteral() as any,
        defaultMiroirModelEnvironment,
        {},
        {},
      ),
    );
  });
});

describe.skipIf(!shouldRun).sequential("externalServiceDispatch — Cycle 3 composite invocation (Goal 5)", () => {
  it("compositeActionSequence get-playlist returns the fixture playlist", async () => {
    const result = await serverDomainController.handleAction(
      {
        actionType: "compositeActionSequence",
        endpoint: DOMAIN_ENDPOINT,
        payload: {
          application: selfApplicationLibrary.uuid,
          actionSequence: [
            {
              actionType: "get-playlist",
              endpoint: TEST_ENDPOINT_UUID,
              payload: { playlist_id: PLAYLIST_ID_OK },
              actionLabel: "playlist",
            },
          ],
        },
      } as any,
      applicationDeploymentMap,
      defaultLibraryModelEnvironment,
    );
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    expect((result as { returnedDomainElement?: { name?: string } }).returnedDomainElement?.name).toBe(
      PLAYLIST_NAME_LITERAL,
    );
    expect(fakeServer.receivedRequests).toHaveLength(1);
    expect(fakeServer.receivedRequests[0].path).toBe(`/playlists/${PLAYLIST_ID_OK}`);
  });

  it("get-playlist result is available to a subsequent composite step", async () => {
    const result = await serverDomainController.handleAction(
      {
        actionType: "compositeActionSequence",
        endpoint: DOMAIN_ENDPOINT,
        payload: {
          application: selfApplicationLibrary.uuid,
          actionSequence: [
            {
              actionType: "get-playlist",
              endpoint: TEST_ENDPOINT_UUID,
              payload: { playlist_id: PLAYLIST_ID_OK },
              actionLabel: "playlist",
            },
            {
              actionType: "compositeRunBoxedQueryAction",
              endpoint: DOMAIN_ENDPOINT,
              nameGivenToResult: "echo",
              payload: {
                actionType: "runBoxedQueryAction",
                endpoint: QUERY_ENDPOINT,
                payload: {
                  application: selfApplicationLibrary.uuid,
                  applicationSection: "data",
                  query: {
                    queryType: "boxedQueryWithExtractorCombinerTransformer",
                    application: selfApplicationLibrary.uuid,
                    extractors: {
                      fromPrev: {
                        extractorOrCombinerType: "extractorOrCombinerContextReference",
                        extractorOrCombinerContextReference: "playlist",
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      } as any,
      applicationDeploymentMap,
      defaultLibraryModelEnvironment,
    );
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);
    expect(
      (result as { returnedDomainElement?: { fromPrev?: { name?: string } } }).returnedDomainElement
        ?.fromPrev?.name,
    ).toBe(PLAYLIST_NAME_LITERAL);
  });
});

describe.skipIf(!shouldRun).sequential("externalServiceDispatch — Cycle 4 client-side hard errors (D5)", () => {
  it("sync QuerySelectors.runQuery on extractorFromAction names the extractor", async () => {
    const result = runQuery(
      {},
      applicationDeploymentMap,
      {
        extractor: {
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          application: selfApplicationLibrary.uuid,
          extractors: { playlist: extractorFromActionLiteral() },
        },
      } as any,
      defaultMiroirModelEnvironment,
    );
    expect(result instanceof Domain2ElementFailed, JSON.stringify(result)).toBe(true);
    namesExtractorFromAction((result as Domain2ElementFailed).failureMessage ?? "");
  });

  it("runAsSql: true on a query containing extractorFromAction is a hard error", async () => {
    const result = await domainController.handleBoxedExtractorOrQueryAction(
      boxedFromActionQuery(TEST_ENDPOINT_UUID, "get-playlist", { playlist_id: PLAYLIST_ID_OK }, {
        runAsSql: true,
      }) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expectActionError(result, /extractorFromAction|runAsSql|SQL/i);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });
});
