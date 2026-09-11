/**
 * #270 Slice 1 tracer — persist Admin MiroirSecret, hydrate, fake Spotify query.
 *
 * Vitest integ: live HTTP server + Admin persist/hydrate are not MiroirTest-reachable.
 *
 * Run:
 * ```bash
 * RUN_TEST=secretsHydrate.270.phase1 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsHydrate.270.phase1
 * ```
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type {
  ApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
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
  clearSecretsMasterKey,
  ConfigurationService,
  defaultMetaModelEnvironment,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  ENTITY_MIROIR_SECRET_UUID,
  encryptSecret,
  hydrateSecrets,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  resetAndInitApplicationDeployment,
  resetIntegTestbed,
  setSecretsMasterKey,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirMongoDbStoreSectionStartup } from "miroir-store-mongodb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import {
  adminSelfApplication,
  deployment_Admin,
  deployment_Miroir,
} from "miroir-test-app_deployment-admin";
import {
  deployment_Library_DO_NO_USE,
  endpointDocument,
  getDefaultLibraryModelEnvironmentDEFUNCT,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { selfApplicationDeploymentConfigurationsTO_REMOVE } from "../../../../src/miroir-fwk/4-tests/tests-utils.js";
import { miroirAppStartup } from "../../../../src/startup.js";
import { AppStackIntegrationTestSession } from "../../../helpers/IntegrationTestSession.js";
import {
  libraryEntitiesAndInstances,
  libraryTestbedInitParams,
} from "../../../helpers/libraryPlayfieldSeeds.js";
import { loadTestConfigFiles } from "../../../utils/fileTools.js";
import {
  startFakeExternalServiceServer,
  type FakeExternalServiceServer,
} from "../../../utils/fakeExternalServiceServer.js";
import { cleanLevel, packageName } from "../../constants.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "secretsHydrate.270" ||
  RUN_TEST.startsWith("secretsHydrate.270") ||
  RUN_TEST === "secretsHydrate.270.phase1";

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures");
const PLAYLIST_OK = JSON.parse(readFileSync(join(FIXTURES_DIR, "playlist-ok.json"), "utf8")) as {
  name: string;
  tracks: { total: number };
};

const PLAYLIST_NAME_LITERAL = "Rock Classics";
const PLAYLIST_ID_OK = "test-playlist-001";
const TEST_ENDPOINT_UUID = "c8f2a1b4-6d3e-4a91-9b07-2e5c8d1f4a63";
const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const WRAPPING_KEY = "test-secrets-master";
const HYDRATED_VALUE = "hydrated-from-row";
const SECRET_NAME = "fakeSpotify";
const SECRET_INSTANCE_UUID = "270a0001-2b38-494a-8027-82617e2d64ad";

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
const fileName = "secretsHydrate.270.phase1.integ.test";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName);

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

const miroirDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client
  .emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];

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
let domainControllerForServer: DomainControllerInterface;
let fakeServer: FakeExternalServiceServer;
const createdSecretUuids: string[] = [];

function testEndpointInstance(baseUrl: string): EndpointDefinition {
  return {
    uuid: TEST_ENDPOINT_UUID,
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: selfApplicationLibrary.uuid,
    name: "FakeSpotifySlice270",
    version: "1",
    description: "Slice 1 tracer endpoint — bearer from hydrated MiroirSecret",
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
        credentialKey: SECRET_NAME,
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

function secretInstance(): EntityInstance {
  return {
    uuid: SECRET_INSTANCE_UUID,
    parentName: "MiroirSecret",
    parentUuid: ENTITY_MIROIR_SECRET_UUID,
    name: SECRET_NAME,
    ciphertext: encryptSecret("aes-256-gcm", WRAPPING_KEY, HYDRATED_VALUE),
    algorithm: "aes-256-gcm",
  } as EntityInstance;
}

async function persistSecretRow(): Promise<void> {
  const createResult = await domainControllerForServer.handleAction(
    {
      actionType: "createInstance",
      actionLabel: "secrets.set",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: ADMIN_APPLICATION_UUID,
        applicationSection: "data",
        objects: [secretInstance()],
      },
    },
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  expect(
    createResult instanceof Action2Error,
    `createInstance failed: ${JSON.stringify(createResult)}`,
  ).toBe(false);
  createdSecretUuids.push(SECRET_INSTANCE_UUID);
}

async function querySecretRows(): Promise<Record<string, unknown>[]> {
  const queryResult = await domainControllerForServer.handleBoxedExtractorOrQueryAction(
    {
      actionType: "runBoxedQueryAction",
      endpoint: QUERY_ENDPOINT,
      payload: {
        application: adminSelfApplication.uuid,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          application: adminSelfApplication.uuid,
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          extractors: {
            secrets: {
              extractorOrCombinerType: "extractorInstancesByEntity",
              parentUuid: ENTITY_MIROIR_SECRET_UUID,
            },
          },
        },
      },
    },
    applicationDeploymentMap,
    defaultMetaModelEnvironment,
  );
  expect(
    queryResult instanceof Action2Error,
    `secret query failed: ${JSON.stringify(queryResult)}`,
  ).toBe(false);
  const element = (queryResult as { returnedDomainElement?: { secrets?: unknown } })
    .returnedDomainElement?.secrets;
  if (Array.isArray(element)) {
    return element as Record<string, unknown>[];
  }
  if (element && typeof element === "object") {
    return Object.values(element as Record<string, Record<string, unknown>>);
  }
  return [];
}

async function deleteCreatedSecretRows(): Promise<void> {
  const uuids = [...createdSecretUuids];
  createdSecretUuids.length = 0;
  for (const uuid of uuids) {
    await domainControllerForServer.handleAction(
      {
        actionType: "deleteInstance",
        actionLabel: "secrets.delete",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: ADMIN_APPLICATION_UUID,
          applicationSection: "data",
          objects: [
            {
              uuid,
              parentUuid: ENTITY_MIROIR_SECRET_UUID,
            } as EntityInstance,
          ],
        },
      },
      applicationDeploymentMap,
      defaultMetaModelEnvironment,
    );
  }
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
  if (!shouldRun) {
    return;
  }
  if (!miroirConfig.client.emulateServer) {
    throw new Error(
      "secretsHydrate.270.phase1 requires emulateServer: true (in-process server path).",
    );
  }

  fakeServer = await startFakeExternalServiceServer({
    [`GET /playlists/${PLAYLIST_ID_OK}`]: { body: PLAYLIST_OK },
  });
  allowInsecureBaseUrlsForTests([fakeServer.baseUrl]);

  const session = new AppStackIntegrationTestSession(miroirConfig, {
    applicationDeploymentMap,
    adminDeployment,
    libraryDeploymentStorageConfiguration,
    miroirDeploymentStorageConfiguration,
    openAdminAndMiroirStoresOnServer: true,
    miroirActivityTracker,
    miroirEventService,
  });
  const executionEnvironment = await session.initSession();
  domainController = executionEnvironment.domainController;
  if (!executionEnvironment.domainControllerForServer) {
    throw new Error("domainControllerForServer missing from executionEnvironment");
  }
  domainControllerForServer = executionEnvironment.domainControllerForServer;

  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
  ]);
}, 60000);

beforeEach(async () => {
  if (!shouldRun) {
    return;
  }
  fakeServer.receivedRequests.length = 0;
  clearExternalServiceTokenCacheForTests();
  clearSecrets();
  clearSecretsMasterKey();
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
  await persistSecretRow();
}, 60000);

afterEach(async () => {
  if (!shouldRun) {
    return;
  }
  await deleteCreatedSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
});

afterAll(async () => {
  if (!shouldRun) {
    return;
  }
  await deleteCreatedSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
  clearAllowedInsecureBaseUrlsForTests();
  if (fakeServer) {
    await fakeServer.close();
  }
});

describe.skipIf(!shouldRun).sequential("secretsHydrate.270.phase1 — persist + hydrate + fake Spotify", () => {
  it("hydrated row is used as Bearer token for get-playlist", async () => {
    const rows = await querySecretRows();
    expect(rows.length).toBeGreaterThan(0);
    setSecretsMasterKey(WRAPPING_KEY);
    hydrateSecrets({ wrappingKey: WRAPPING_KEY, rows });

    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error, JSON.stringify(queryResult)).toBe(false);
    const playlist = (
      queryResult as { returnedDomainElement: { playlist: { name: string; tracks: { total: number } } } }
    ).returnedDomainElement.playlist;
    expect(playlist.name).toBe(PLAYLIST_NAME_LITERAL);
    expect(playlist.tracks.total).toBe(17);

    expect(fakeServer.receivedRequests).toHaveLength(1);
    expect(fakeServer.receivedRequests[0].headers.authorization).toBe(`Bearer ${HYDRATED_VALUE}`);
  });

  it("no hydrate / no wrapping key fails closed with Unknown or empty secret", async () => {
    const queryResult = await domainController.handleBoxedExtractorOrQueryAction(
      boxedGetPlaylistQuery(PLAYLIST_ID_OK) as any,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
    );

    expect(queryResult instanceof Action2Error).toBe(true);
    const message = (queryResult as Action2Error).errorMessage ?? "";
    expect(message).toMatch(/Unknown or empty secret/);
    expect(fakeServer.receivedRequests).toHaveLength(0);
  });
});
