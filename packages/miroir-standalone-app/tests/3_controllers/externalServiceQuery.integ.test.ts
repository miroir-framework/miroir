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

function boxedGetPlaylistQuery(playlistId: string) {
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
            actionType: "get-playlist",
            parameterBindings: { playlist_id: playlistId },
          },
        },
      },
    },
  };
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
      "externalServiceQuery requires emulateServer: true (in-process server path).",
    );
  }

  fakeServer = await startFakeExternalServiceServer({
    [`GET /playlists/${PLAYLIST_ID_OK}`]: { body: PLAYLIST_OK },
    [`GET /playlists/${PLAYLIST_ID_WRONG_TYPE}`]: { body: PLAYLIST_WRONG_TYPE },
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

  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
  ]);
}, 60000);

beforeEach(async () => {
  fakeServer.receivedRequests.length = 0;
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
});
