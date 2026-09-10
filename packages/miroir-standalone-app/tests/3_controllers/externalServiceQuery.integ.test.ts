/**
 * extractorFromAction end-to-end — extractorFromAction end-to-end against a local fake Spotify server.
 *
 * Vitest integ: live HTTP server + in-process secrets are not MiroirTest-reachable.
 *
 * Run:
 * ```bash
 * VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json \
 *   RUN_TEST=externalServiceQuery npm run testByFile -w miroir-standalone-app -- externalServiceQuery
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
  clearAllowedInsecureBaseUrlsForTests,
  clearExternalServiceTokenCacheForTests,
  clearSecrets,
  ConfigurationService,
  defaultMetaModelEnvironment,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  DomainControllerInterface,
  getExternalService,
  transformer_extended_apply,
  TransformerFailure,
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
import {
  defaultMiroirMetaModel,
  selfApplicationMiroir,
  spotifyOpenApiExcerptGetPlaylist,
  spotifyServiceEndpointSyncInput,
} from "miroir-test-app_deployment-miroir";

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
  RUN_TEST === "externalServiceQuery" ||
  RUN_TEST === "externalServiceQuery.integ.test";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const PLAYLIST_OK = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "playlist-ok.json"), "utf8"),
) as { name: string; tracks: { total: number }; unknownExtraField?: string };
const PLAYLIST_WRONG_TYPE = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "playlist-wrong-type.json"), "utf8"),
) as { name: unknown };

const PLAYLIST_NAME_LITERAL = "Rock Classics";
const PLAYLIST_ID_OK = "test-playlist-001";
const PLAYLIST_ID_WRONG_TYPE = "test-playlist-wrong-type";
const TEST_ENDPOINT_UUID = "c8f2a1b4-6d3e-4a91-9b07-2e5c8d1f4a63";
const TEST_ENDPOINT_CC_UUID = "b7e3d2c1-5a4f-4e82-8c19-3d7b6a5e4f21";
const TEST_ENDPOINT_AC_UUID = "a6d4c3b2-4e3f-4d71-9b08-2c6a5d4e3f10";
const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

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
const fileName = "externalServiceQuery.integ.test";
const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);

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
    name: "FakeSpotifySlice2",
    version: "1",
    description: "Slice 2 tracer endpoint — externalService against the local fake server",
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

function testClientCredentialsEndpointInstance(baseUrl: string): EndpointDefinition {
  return {
    uuid: TEST_ENDPOINT_CC_UUID,
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: selfApplicationLibrary.uuid,
    name: "FakeSpotifyClientCredentials",
    version: "1",
    description: "OAuth2 client-credentials tracer endpoint against the local fake server",
    definition: {
      externalService: {
        openApiDocument:
          '{"openapi":"3.0.0","info":{"title":"FakeSpotify","version":"1.0.0"},"paths":{}}',
        baseUrl,
        securityScheme: {
          type: "oauth2ClientCredentials",
          tokenUrl: `${baseUrl}/api/token`,
          clientIdKey: "fakeClientId",
          clientSecretKey: "fakeClientSecret",
        },
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

function testAuthorizationCodeEndpointInstance(baseUrl: string): EndpointDefinition {
  return {
    uuid: TEST_ENDPOINT_AC_UUID,
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: selfApplicationLibrary.uuid,
    name: "FakeSpotifyAuthorizationCode",
    version: "1",
    description: "OAuth2 authorization-code refresh-token tracer endpoint against the local fake server",
    definition: {
      externalService: {
        openApiDocument:
          '{"openapi":"3.0.0","info":{"title":"FakeSpotify","version":"1.0.0"},"paths":{}}',
        baseUrl,
        securityScheme: {
          type: "oauth2AuthorizationCode",
          tokenUrl: `${baseUrl}/api/token`,
          clientIdKey: "fakeClientId",
          clientSecretKey: "fakeClientSecret",
          refreshTokenKey: "fakeRefreshToken",
        },
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

function boxedGetPlaylistQuery(playlistId: string, endpointUuid: string = TEST_ENDPOINT_UUID) {
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
            endpointUuid,
            actionType: "get-playlist",
            parameterBindings: { playlist_id: playlistId },
          },
        },
      },
    },
  };
}

async function commitEndpointInstance(endpointInstance: EndpointDefinition): Promise<void> {
  const createResult = await domainController.handleAction(
    {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "model",
        objects: [endpointInstance as EntityInstance],
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

async function commitTestEndpoint(): Promise<void> {
  await commitEndpointInstance(testEndpointInstance(fakeServer.baseUrl));
}

beforeAll(async () => {
  if (!miroirConfig.client.emulateServer) {
    throw new Error(
      "externalServiceQuery requires emulateServer: true (in-process server path).",
    );
  }

  fakeServer = await startFakeExternalServiceServer({
    [`GET /playlists/${PLAYLIST_ID_OK}`]: { body: PLAYLIST_OK },
    [`GET /playlists/${PLAYLIST_ID_WRONG_TYPE}`]: { body: PLAYLIST_WRONG_TYPE },
  });
  registerSecrets({
    fakeSpotify: "test-token",
    fakeClientId: "id-123",
    fakeClientSecret: "secret-abc",
    fakeRefreshToken: "refresh-xyz",
  });
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
}, 60000);

beforeEach(async () => {
  fakeServer.receivedRequests.length = 0;
  clearExternalServiceTokenCacheForTests();
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
}, 60000);

afterAll(async () => {
  clearSecrets();
  clearAllowedInsecureBaseUrlsForTests();
  if (fakeServer) {
    await fakeServer.close();
  }
});

describe.skipIf(!shouldRun).sequential("externalServiceQuery — extractorFromAction vs fake Spotify", () => {
  it("boxed extractorFromAction returns the fixture playlist through the emulated-server path", async () => {
    expect(PLAYLIST_OK.name).toBe(PLAYLIST_NAME_LITERAL);

    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (queryResult as { returnedDomainElement: { playlist: { name: string; tracks: { total: number } } } })
      .returnedDomainElement.playlist;
    expect(playlist.name).toBe(PLAYLIST_NAME_LITERAL);
    expect(playlist.tracks.total).toBe(17);

    expect(fakeServer.receivedRequests).toHaveLength(1);
    expect(fakeServer.receivedRequests[0].method).toBe("GET");
    expect(fakeServer.receivedRequests[0].path).toBe(`/playlists/${PLAYLIST_ID_OK}`);
    const authorization = fakeServer.receivedRequests[0].headers.authorization;
    expect(authorization).toBe("Bearer test-token");
  });

  it("still works when the caller passes defaultMiroirModelEnvironment (production REST case)", async () => {
    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    expect(
      (queryResult as { returnedDomainElement: { playlist: { name: string } } }).returnedDomainElement
        .playlist.name,
    ).toBe(PLAYLIST_NAME_LITERAL);
  });

  it("D11: strips unknown fixture fields from the result", async () => {
    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (queryResult as { returnedDomainElement: { playlist: Record<string, unknown> } })
      .returnedDomainElement.playlist;
    expect(playlist.name).toBe(PLAYLIST_NAME_LITERAL);
    expect(playlist.unknownExtraField).toBeUndefined();
    expect(playlist.anotherUnknown).toBeUndefined();
    expect(playlist.description).toBeUndefined();
    expect((playlist.tracks as { href?: string }).href).toBeUndefined();
  });

  it("D11: wrong-typed known field is a validation error, not a crash", async () => {
    let queryResult: unknown;
    try {
      queryResult = await domainController.handleBoxedExtractorOrQueryAction(
        boxedGetPlaylistQuery(PLAYLIST_ID_WRONG_TYPE) as any,
        applicationDeploymentMap,
        defaultMiroirModelEnvironment,
      );
    } catch (error) {
      expect.fail(`validation mismatch must not throw: ${String(error)}`);
    }
    expect(queryResult instanceof Action2Error).toBe(true);
    const message = (queryResult as Action2Error).errorMessage ?? "";
    expect(message.toLowerCase()).toMatch(/validat|type|mismatch/);
  });

  it("loop-closure: query runs against operations produced by syncExternalServiceSchema", async () => {
    const syncInputEndpoint = {
      ...spotifyServiceEndpointSyncInput,
      uuid: TEST_ENDPOINT_UUID,
      application: selfApplicationLibrary.uuid,
      definition: {
        externalService: {
          ...spotifyServiceEndpointSyncInput.definition.externalService,
          baseUrl: fakeServer.baseUrl,
          credentialKey: "fakeSpotify",
          enabledOperations: ["get-playlist"],
          operations: [],
        },
      },
    };
    const syncResult = transformer_extended_apply(
      "runtime",
      [],
      undefined,
      { transformerType: "syncExternalServiceSchema", interpolation: "runtime" } as any,
      "value",
      defaultMetaModelEnvironment,
      {
        openApiDocument: spotifyOpenApiExcerptGetPlaylist,
        appModel: { endpoints: [syncInputEndpoint] },
        scope: ["get-playlist"],
        endpointUuid: TEST_ENDPOINT_UUID,
      },
    );
    expect(syncResult instanceof TransformerFailure, JSON.stringify(syncResult)).toBe(false);
    const operations = (syncResult as {
      payload: {
        actionSequence: Array<{
          payload?: { objects?: Array<{ definition?: { externalService?: { operations?: unknown[] } } }> };
        }>;
      };
    }).payload.actionSequence[0].payload?.objects?.[0].definition?.externalService?.operations;
    expect(Array.isArray(operations) && operations.length).toBeGreaterThan(0);
    expect((operations as Array<{ operationId: string }>)[0].operationId).toBe("get-playlist");

    const handWritten = testEndpointInstance(fakeServer.baseUrl);
    const handWrittenExternal = getExternalService(handWritten);
    expect(handWrittenExternal, "hand-written test endpoint must be an externalService").toBeDefined();
    const updateResult = await domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: selfApplicationLibrary.uuid,
          applicationSection: "model",
          objects: [
            {
              ...handWritten,
              definition: {
                externalService: {
                  ...handWrittenExternal,
                  operations,
                },
              },
            } as EntityInstance,
          ],
        },
      },
      applicationDeploymentMap,
      defaultLibraryModelEnvironment,
    );
    expect(updateResult instanceof Action2Error, JSON.stringify(updateResult)).toBe(false);
    const commitResult = await domainController.handleAction(
      {
        actionType: "commit",
        endpoint: MODEL_ENDPOINT,
        payload: { application: selfApplicationLibrary.uuid },
      },
      applicationDeploymentMap,
      defaultLibraryModelEnvironment,
    );
    expect(commitResult instanceof Action2Error, JSON.stringify(commitResult)).toBe(false);

    fakeServer.receivedRequests.length = 0;
    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );
    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (queryResult as { returnedDomainElement: { playlist: { name: string } } })
      .returnedDomainElement.playlist;
    expect(playlist.name).toBe(PLAYLIST_NAME_LITERAL);
    expect(fakeServer.receivedRequests).toHaveLength(1);
  });

  it("unresolved (object-valued) parameter binding is a clear error, never an HTTP call with '[object Object]'", async () => {
    // Live-bug regression: when a query template's getFromParameters reference is missing from the
    // page params, resolution yields a TransformerFailure object; it must not be String()-ified
    // into the request path.
    fakeServer.receivedRequests.length = 0;
    const query = boxedGetPlaylistQuery("ignored");
    (query.payload.query.extractors.playlist as { parameterBindings: Record<string, unknown> })
      .parameterBindings = {
      playlist_id: {
        queryFailure: "ReferenceNotFound",
        failureMessage: "could not find reference playlistId in pageParams",
      },
    };

    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      query as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error).toBe(true);
    const message = (queryResult as Action2Error).errorMessage ?? "";
    expect(message).toContain("playlist_id");
    expect(message).toContain("playlistId");
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });
});

describe.skipIf(!shouldRun).sequential("externalServiceQuery — oauth2ClientCredentials flow", () => {
  const EXPECTED_BASIC_AUTH = `Basic ${Buffer.from("id-123:secret-abc", "utf8").toString("base64")}`;

  it("exchanges client id/secret for a token, then calls the API with it", async () => {
    await commitEndpointInstance(testClientCredentialsEndpointInstance(fakeServer.baseUrl));
    fakeServer.setFixture("POST", "/api/token", {
      body: { access_token: "fake-access-token-1", token_type: "Bearer", expires_in: 3600 },
    });

    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK, TEST_ENDPOINT_CC_UUID) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (queryResult as { returnedDomainElement: { playlist: { name: string } } })
      .returnedDomainElement.playlist;
    expect(playlist.name).toBe(PLAYLIST_NAME_LITERAL);

    expect(fakeServer.receivedRequests).toHaveLength(2);
    const [tokenRequest, apiRequest] = fakeServer.receivedRequests;
    expect(tokenRequest.method).toBe("POST");
    expect(tokenRequest.path).toBe("/api/token");
    expect(tokenRequest.headers.authorization).toBe(EXPECTED_BASIC_AUTH);
    expect(tokenRequest.headers["content-type"]).toBe("application/x-www-form-urlencoded");
    expect(tokenRequest.body).toContain("grant_type=client_credentials");
    expect(apiRequest.method).toBe("GET");
    expect(apiRequest.path).toBe(`/playlists/${PLAYLIST_ID_OK}`);
    expect(apiRequest.headers.authorization).toBe("Bearer fake-access-token-1");
  });

  it("caches the token across queries (no second exchange)", async () => {
    await commitEndpointInstance(testClientCredentialsEndpointInstance(fakeServer.baseUrl));
    fakeServer.setFixture("POST", "/api/token", {
      body: { access_token: "fake-access-token-1", token_type: "Bearer", expires_in: 3600 },
    });

    for (let i = 0; i < 2; i++) {
      const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
        boxedGetPlaylistQuery(PLAYLIST_ID_OK, TEST_ENDPOINT_CC_UUID) as any,
        applicationDeploymentMap,
        defaultMiroirModelEnvironment,
      );
      expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    }

    const tokenRequests = fakeServer.receivedRequests.filter((r) => r.path === "/api/token");
    const apiRequests = fakeServer.receivedRequests.filter((r) => r.path !== "/api/token");
    expect(tokenRequests).toHaveLength(1);
    expect(apiRequests).toHaveLength(2);
    for (const request of apiRequests) {
      expect(request.headers.authorization).toBe("Bearer fake-access-token-1");
    }
  });

  it("401 drops the cached token, re-exchanges, and retries once", async () => {
    await commitEndpointInstance(testClientCredentialsEndpointInstance(fakeServer.baseUrl));
    fakeServer.setFixture("POST", "/api/token", {
      sequence: [
        { body: { access_token: "stale-token", token_type: "Bearer", expires_in: 3600 } },
        { body: { access_token: "fresh-token", token_type: "Bearer", expires_in: 3600 } },
      ],
    });
    fakeServer.setFixtureForAuth("GET", `/playlists/${PLAYLIST_ID_OK}`, "Bearer stale-token", {
      status: 401,
      body: { error: { status: 401, message: "The access token expired" } },
    });
    fakeServer.setFixtureForAuth("GET", `/playlists/${PLAYLIST_ID_OK}`, "Bearer fresh-token", {
      body: PLAYLIST_OK,
    });

    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK, TEST_ENDPOINT_CC_UUID) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (queryResult as { returnedDomainElement: { playlist: { name: string } } })
      .returnedDomainElement.playlist;
    expect(playlist.name).toBe(PLAYLIST_NAME_LITERAL);

    const paths = fakeServer.receivedRequests.map((r) => `${r.method} ${r.path}`);
    expect(paths).toEqual([
      "POST /api/token",
      `GET /playlists/${PLAYLIST_ID_OK}`,
      "POST /api/token",
      `GET /playlists/${PLAYLIST_ID_OK}`,
    ]);
    expect(fakeServer.receivedRequests[1].headers.authorization).toBe("Bearer stale-token");
    expect(fakeServer.receivedRequests[3].headers.authorization).toBe("Bearer fresh-token");
  });
});

describe.skipIf(!shouldRun).sequential("externalServiceQuery — oauth2AuthorizationCode flow", () => {
  const EXPECTED_BASIC_AUTH = `Basic ${Buffer.from("id-123:secret-abc", "utf8").toString("base64")}`;

  it("exchanges refresh token for an access token, then calls the API with it", async () => {
    await commitEndpointInstance(testAuthorizationCodeEndpointInstance(fakeServer.baseUrl));
    fakeServer.setFixture("POST", "/api/token", {
      body: { access_token: "fake-access-token-1", token_type: "Bearer", expires_in: 3600 },
    });

    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK, TEST_ENDPOINT_AC_UUID) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (queryResult as { returnedDomainElement: { playlist: { name: string } } })
      .returnedDomainElement.playlist;
    expect(playlist.name).toBe(PLAYLIST_NAME_LITERAL);

    expect(fakeServer.receivedRequests).toHaveLength(2);
    const [tokenRequest, apiRequest] = fakeServer.receivedRequests;
    expect(tokenRequest.method).toBe("POST");
    expect(tokenRequest.path).toBe("/api/token");
    expect(tokenRequest.headers.authorization).toBe(EXPECTED_BASIC_AUTH);
    expect(tokenRequest.headers["content-type"]).toBe("application/x-www-form-urlencoded");
    expect(tokenRequest.body).toContain("grant_type=refresh_token");
    expect(tokenRequest.body).toContain("refresh_token=refresh-xyz");
    expect(apiRequest.method).toBe("GET");
    expect(apiRequest.path).toBe(`/playlists/${PLAYLIST_ID_OK}`);
    expect(apiRequest.headers.authorization).toBe("Bearer fake-access-token-1");
  });

  it("caches the token across queries (no second exchange)", async () => {
    await commitEndpointInstance(testAuthorizationCodeEndpointInstance(fakeServer.baseUrl));
    fakeServer.setFixture("POST", "/api/token", {
      body: { access_token: "fake-access-token-1", token_type: "Bearer", expires_in: 3600 },
    });

    for (let i = 0; i < 2; i++) {
      const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
        boxedGetPlaylistQuery(PLAYLIST_ID_OK, TEST_ENDPOINT_AC_UUID) as any,
        applicationDeploymentMap,
        defaultMiroirModelEnvironment,
      );
      expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    }

    const tokenRequests = fakeServer.receivedRequests.filter((r) => r.path === "/api/token");
    const apiRequests = fakeServer.receivedRequests.filter((r) => r.path !== "/api/token");
    expect(tokenRequests).toHaveLength(1);
    expect(apiRequests).toHaveLength(2);
    for (const request of apiRequests) {
      expect(request.headers.authorization).toBe("Bearer fake-access-token-1");
    }
  });

  it("401 drops the cached token, re-exchanges, and retries once", async () => {
    await commitEndpointInstance(testAuthorizationCodeEndpointInstance(fakeServer.baseUrl));
    fakeServer.setFixture("POST", "/api/token", {
      sequence: [
        { body: { access_token: "stale-token", token_type: "Bearer", expires_in: 3600 } },
        { body: { access_token: "fresh-token", token_type: "Bearer", expires_in: 3600 } },
      ],
    });
    fakeServer.setFixtureForAuth("GET", `/playlists/${PLAYLIST_ID_OK}`, "Bearer stale-token", {
      status: 401,
      body: { error: { status: 401, message: "The access token expired" } },
    });
    fakeServer.setFixtureForAuth("GET", `/playlists/${PLAYLIST_ID_OK}`, "Bearer fresh-token", {
      body: PLAYLIST_OK,
    });

    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK, TEST_ENDPOINT_AC_UUID) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (queryResult as { returnedDomainElement: { playlist: { name: string } } })
      .returnedDomainElement.playlist;
    expect(playlist.name).toBe(PLAYLIST_NAME_LITERAL);

    const paths = fakeServer.receivedRequests.map((r) => `${r.method} ${r.path}`);
    expect(paths).toEqual([
      "POST /api/token",
      `GET /playlists/${PLAYLIST_ID_OK}`,
      "POST /api/token",
      `GET /playlists/${PLAYLIST_ID_OK}`,
    ]);
    expect(fakeServer.receivedRequests[1].headers.authorization).toBe("Bearer stale-token");
    expect(fakeServer.receivedRequests[3].headers.authorization).toBe("Bearer fresh-token");
  });

  it("rotated refresh_token from the token response is used on the next exchange", async () => {
    await commitEndpointInstance(testAuthorizationCodeEndpointInstance(fakeServer.baseUrl));
    fakeServer.setFixture("POST", "/api/token", {
      sequence: [
        {
          body: {
            access_token: "stale-token",
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token: "refresh-rotated",
          },
        },
        { body: { access_token: "fresh-token", token_type: "Bearer", expires_in: 3600 } },
      ],
    });
    fakeServer.setFixtureForAuth("GET", `/playlists/${PLAYLIST_ID_OK}`, "Bearer stale-token", {
      status: 401,
      body: { error: { status: 401, message: "The access token expired" } },
    });
    fakeServer.setFixtureForAuth("GET", `/playlists/${PLAYLIST_ID_OK}`, "Bearer fresh-token", {
      body: PLAYLIST_OK,
    });

    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK, TEST_ENDPOINT_AC_UUID) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (queryResult as { returnedDomainElement: { playlist: { name: string } } })
      .returnedDomainElement.playlist;
    expect(playlist.name).toBe(PLAYLIST_NAME_LITERAL);

    const tokenRequests = fakeServer.receivedRequests.filter((r) => r.path === "/api/token");
    expect(tokenRequests).toHaveLength(2);
    expect(tokenRequests[0].body).toContain("grant_type=refresh_token");
    expect(tokenRequests[0].body).toContain("refresh_token=refresh-xyz");
    expect(tokenRequests[1].body).toContain("grant_type=refresh_token");
    expect(tokenRequests[1].body).toContain("refresh_token=refresh-rotated");
  });
});
