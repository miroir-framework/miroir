/**
 * External service HTTP guards — HTTP error semantics (D12) + SSRF/credential/allowlist guards (D13).
 *
 * Reuses the Slice 2 fixture (fake server + secrets + committed test endpoint).
 *
 * Run:
 * ```bash
 * RUN_TEST=externalServiceGuards npm run testByFile -w miroir-standalone-app -- externalServiceGuards --profile emulatedServer-filesystem
 * ```
 */
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
  clearAllowedInsecureBaseUrlsForTests,
  clearExternalServiceTokenCacheForTests,
  clearSecrets,
  ConfigurationService,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  DomainControllerInterface,
  executeExternalServiceOperation,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  registerSecrets,
  resetAndInitApplicationDeployment,
  resetIntegTestbed,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
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
  RUN_TEST === "externalServiceGuards" ||
  RUN_TEST === "externalServiceGuards.integ.test";

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

const PLAYLIST_ID_OK = "test-playlist-001";
const TEST_ENDPOINT_UUID = "c8f2a1b4-6d3e-4a91-9b07-2e5c8d1f4a63";
const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

const SCHEMA_MISMATCH_ERROR_BODY = {
  error: { status: 404, message: "playlist missing" },
  name: 123,
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
const fileName = "externalServiceGuards.integ.test";

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
let fakeServer: FakeExternalServiceServer;

function testEndpointInstance(baseUrl: string): EndpointDefinition {
  return {
    uuid: TEST_ENDPOINT_UUID,
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: selfApplicationLibrary.uuid,
    name: "FakeSpotifySlice3",
    version: "1",
    description: "Slice 3 hardening endpoint — same fixture as Slice 2",
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
        enabledOperations: ["get-playlist"],
        operations: [
          {
            operationId: "get-playlist",
            method: "GET",
            path: "/playlists/{playlist_id}",
            parameterMappings: [{ name: "playlist_id", in: "path", required: true }],
            responseSchema: PLAYLIST_RESPONSE_SCHEMA,
          },
        ],
      },
    },
  } as EndpointDefinition;
}

function syntheticEndpoint(overrides: {
  baseUrl?: string;
  credentialKey?: string;
  securityScheme?: Record<string, unknown>;
  enabledOperations?: string[];
  extraOperations?: Array<{ operationId: string; method: string; path: string }>;
}): EndpointDefinition {
  const extra = (overrides.extraOperations ?? []).map((operation) => ({
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    parameterMappings: [] as Array<{ name: string; in: string; required?: boolean }>,
    responseSchema: PLAYLIST_RESPONSE_SCHEMA,
  }));
  const instance = testEndpointInstance(overrides.baseUrl ?? fakeServer.baseUrl);
  const externalService = (instance.definition as { externalService: Record<string, unknown> })
    .externalService;
  if (overrides.credentialKey !== undefined) {
    externalService.credentialKey = overrides.credentialKey;
  }
  if (overrides.securityScheme !== undefined) {
    externalService.securityScheme = overrides.securityScheme;
    delete externalService.credentialKey;
  }
  if (overrides.enabledOperations !== undefined) {
    externalService.enabledOperations = overrides.enabledOperations;
  }
  externalService.operations = [
    ...(externalService.operations as unknown[]),
    ...extra,
  ];
  return instance;
}

const CC_SCHEME = (tokenUrl: string) => ({
  type: "oauth2ClientCredentials",
  tokenUrl,
  clientIdKey: "fakeClientId",
  clientSecretKey: "fakeClientSecret",
});

function boxedGetPlaylistQuery(playlistId: string, actionType = "get-playlist") {
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
        extractors: {
          playlist: {
            extractorOrCombinerType: "extractorFromAction",
            endpointUuid: TEST_ENDPOINT_UUID,
            actionType,
            parameterBindings: { playlist_id: playlistId },
          },
        },
      },
    },
  };
}

function expectActionError(
  result: unknown,
  errorType: string,
  messagePattern?: RegExp,
): Action2Error {
  expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
  const error = result as Action2Error;
  expect(error.errorType).toBe(errorType);
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

async function queryPlaylist(playlistId: string, actionType?: string): Promise<unknown> {
  return domainController.handleBoxedExtractorOrQueryAction(
    boxedGetPlaylistQuery(playlistId, actionType) as any,
    applicationDeploymentMap,
    defaultMiroirModelEnvironment,
  );
}

beforeAll(async () => {
  if (!miroirConfig.client.emulateServer) {
    throw new Error(
      "externalServiceGuards requires emulateServer: true (in-process server path).",
    );
  }

  fakeServer = await startFakeExternalServiceServer();
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
  clearExternalServiceTokenCacheForTests();
});

afterAll(async () => {
  clearSecrets();
  clearAllowedInsecureBaseUrlsForTests();
  clearExternalServiceTokenCacheForTests();
  if (fakeServer) {
    await fakeServer.close();
  }
});

describe.skipIf(!shouldRun).sequential("externalServiceGuards — D12 HTTP mapping", () => {
  it.each([
    {
      status: 401,
      playlistId: "test-playlist-401",
      errorType: "ExternalServiceUnauthorized",
      message: /token|expir|restart/i,
    },
    {
      status: 403,
      playlistId: "test-playlist-403",
      errorType: "ExternalServiceUnauthorized",
      message: /token|expir|restart/i,
    },
    {
      status: 404,
      playlistId: "test-playlist-404",
      errorType: "ExternalServiceNotFound",
      message: /not found/i,
    },
    {
      status: 429,
      playlistId: "test-playlist-429",
      errorType: "ExternalServiceRateLimited",
      message: /rate/i,
    },
    {
      status: 500,
      playlistId: "test-playlist-500",
      errorType: "ExternalServiceUpstreamFailure",
      message: /upstream|fail|500/i,
    },
  ] as const)(
    "HTTP $status maps to $errorType without validating the error body",
    async ({ status, playlistId, errorType, message }) => {
      fakeServer.setFixture("GET", `/playlists/${playlistId}`, {
        status,
        body: {
          error: { status, message: `upstream ${status}` },
          name: 123,
        },
      });

      const result = await queryPlaylist(playlistId);
      const error = expectActionError(result, errorType, message);
      expect((error.errorMessage ?? "").toLowerCase()).not.toMatch(/validat|type mismatch/);
    },
  );

  it("404 whose body would fail responseSchema is still ExternalServiceNotFound (never validated)", async () => {
    const playlistId = "test-playlist-404-schema-mismatch";
    fakeServer.setFixture("GET", `/playlists/${playlistId}`, {
      status: 404,
      body: SCHEMA_MISMATCH_ERROR_BODY,
    });

    const result = await queryPlaylist(playlistId);
    const error = expectActionError(result, "ExternalServiceNotFound");
    expect((error.errorMessage ?? "").toLowerCase()).not.toMatch(/validat|type mismatch/);
  });

  it("200 with invalid JSON maps to ExternalServiceUpstreamFailure (not a schema validation error)", async () => {
    const playlistId = "test-playlist-invalid-json";
    fakeServer.setFixture("GET", `/playlists/${playlistId}`, {
      status: 200,
      rawBody: "{not-valid-json",
    });

    const result = await queryPlaylist(playlistId);
    const error = expectActionError(result, "ExternalServiceUpstreamFailure", /json|parse|invalid/i);
    expect((error.errorMessage ?? "").toLowerCase()).not.toMatch(/type mismatch/);
  });

  it("network failure (server closed) maps to ExternalServiceUpstreamFailure", async () => {
    const closedServer = await startFakeExternalServiceServer();
    const closedUrl = closedServer.baseUrl;
    await closedServer.close();
    allowInsecureBaseUrlsForTests([closedUrl]);

    const result = await executeExternalServiceOperation(
      syntheticEndpoint({ baseUrl: closedUrl }),
      "get-playlist",
      { playlist_id: PLAYLIST_ID_OK },
    );
    expectActionError(result, "ExternalServiceUpstreamFailure", /fail|network|unreachable|connect/i);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });
});

describe.skipIf(!shouldRun).sequential("externalServiceGuards — credential failures", () => {
  it("unknown credentialKey fails closed before any fetch", async () => {
    const result = await executeExternalServiceOperation(
      syntheticEndpoint({ credentialKey: "does-not-exist" }),
      "get-playlist",
      { playlist_id: PLAYLIST_ID_OK },
    );
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
    expect(((result as Action2Error).errorMessage ?? "").toLowerCase()).toMatch(/unknown|empty|secret/);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });

  it("empty secret value fails closed before any fetch", async () => {
    registerSecrets({ emptyTestSecret: "" });
    const result = await executeExternalServiceOperation(
      syntheticEndpoint({ credentialKey: "emptyTestSecret" }),
      "get-playlist",
      { playlist_id: PLAYLIST_ID_OK },
    );
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
    expect(((result as Action2Error).errorMessage ?? "").toLowerCase()).toMatch(/unknown|empty|secret/);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });
});

describe.skipIf(!shouldRun).sequential("externalServiceGuards — SSRF default-deny", () => {
  it("without the test opt-in, the fixture loopback http baseUrl is rejected", async () => {
    clearAllowedInsecureBaseUrlsForTests();
    try {
      const result = await executeExternalServiceOperation(
        syntheticEndpoint({ baseUrl: fakeServer.baseUrl }),
        "get-playlist",
        { playlist_id: PLAYLIST_ID_OK },
      );
      expectActionError(result, "InvalidAction", /insecure|private|not allowed/i);
      expect(fakeServer.receivedRequests).toHaveLength(0);
    } finally {
      allowInsecureBaseUrlsForTests([fakeServer.baseUrl]);
    }
  });

  it.each([
    ["http://169.254.169.254", "link-local"],
    ["http://10.1.2.3", "private 10/8"],
    ["http://192.168.1.10", "private 192.168/16"],
    ["http://example.com", "non-https public"],
  ] as const)("without opt-in, %s (%s) is rejected before fetch", async (baseUrl) => {
    const result = await executeExternalServiceOperation(
      syntheticEndpoint({ baseUrl }),
      "get-playlist",
      { playlist_id: PLAYLIST_ID_OK },
    );
    expectActionError(result, "InvalidAction", /insecure|private|not allowed/i);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });
});

describe.skipIf(!shouldRun).sequential("externalServiceGuards — operation allowlist", () => {
  it("operationId present in operations[] but not in enabledOperations is rejected", async () => {
    const result = await executeExternalServiceOperation(
      syntheticEndpoint({
        extraOperations: [{ operationId: "list-playlists", method: "GET", path: "/playlists" }],
      }),
      "list-playlists",
      {},
    );
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
    expect(((result as Action2Error).errorMessage ?? "").toLowerCase()).toMatch(/not enabled|allow/);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });

  it("operationId absent from operations[] is rejected", async () => {
    const result = await executeExternalServiceOperation(
      syntheticEndpoint({}),
      "totally-unknown-operation",
      { playlist_id: PLAYLIST_ID_OK },
    );
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
    expect(((result as Action2Error).errorMessage ?? "").toLowerCase()).toMatch(/unknown|not found|operation/);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });
});

describe.skipIf(!shouldRun).sequential("externalServiceGuards — oauth2ClientCredentials failures", () => {
  it("unknown clientSecretKey fails closed before any fetch", async () => {
    registerSecrets({ fakeClientId: "id-123" });
    const result = await executeExternalServiceOperation(
      syntheticEndpoint({
        securityScheme: {
          type: "oauth2ClientCredentials",
          tokenUrl: `${fakeServer.baseUrl}/api/token`,
          clientIdKey: "fakeClientId",
          clientSecretKey: "does-not-exist",
        },
      }),
      "get-playlist",
      { playlist_id: PLAYLIST_ID_OK },
    );
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
    expect(((result as Action2Error).errorMessage ?? "").toLowerCase()).toMatch(/unknown|empty|secret/);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });

  it("token endpoint non-2xx maps to an error mentioning the token endpoint", async () => {
    registerSecrets({ fakeClientId: "id-123", fakeClientSecret: "secret-abc" });
    fakeServer.setFixture("POST", "/api/token", {
      status: 400,
      body: { error: "invalid_client" },
    });

    const result = await executeExternalServiceOperation(
      syntheticEndpoint({ securityScheme: CC_SCHEME(`${fakeServer.baseUrl}/api/token`) }),
      "get-playlist",
      { playlist_id: PLAYLIST_ID_OK },
    );
    expectActionError(result, "ExternalServiceUpstreamFailure", /token endpoint/i);
    expect(fakeServer.receivedRequests).toHaveLength(1);
    expect(fakeServer.receivedRequests[0].method).toBe("POST");
    expect(fakeServer.receivedRequests[0].path).toBe("/api/token");
  });

  it("token endpoint response without access_token is an upstream failure", async () => {
    registerSecrets({ fakeClientId: "id-123", fakeClientSecret: "secret-abc" });
    fakeServer.setFixture("POST", "/api/token", {
      status: 200,
      body: { token_type: "Bearer" },
    });

    const result = await executeExternalServiceOperation(
      syntheticEndpoint({ securityScheme: CC_SCHEME(`${fakeServer.baseUrl}/api/token`) }),
      "get-playlist",
      { playlist_id: PLAYLIST_ID_OK },
    );
    expectActionError(result, "ExternalServiceUpstreamFailure", /access_token/);
    expect(fakeServer.receivedRequests).toHaveLength(1);
  });

  it("non-allowlisted loopback tokenUrl is rejected before any fetch (SSRF)", async () => {
    registerSecrets({ fakeClientId: "id-123", fakeClientSecret: "secret-abc" });
    const result = await executeExternalServiceOperation(
      syntheticEndpoint({
        securityScheme: CC_SCHEME("http://127.0.0.1:1/api/token"),
      }),
      "get-playlist",
      { playlist_id: PLAYLIST_ID_OK },
    );
    expectActionError(result, "InvalidAction", /insecure|private|not allowed/i);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });
});
