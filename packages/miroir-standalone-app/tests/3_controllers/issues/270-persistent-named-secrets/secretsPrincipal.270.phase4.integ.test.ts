// @vitest-environment node
/**
 * #270 Slice 4 — per-user secrets, principal thread, principal-scoped OAuth cache.
 *
 * Run:
 * ```bash
 * RUN_TEST=secretsPrincipal.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsPrincipal.270
 * ```
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type {
  ApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  EndpointDefinition,
  EntityInstance,
  PersistenceStoreControllerManagerInterface,
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
  defaultSelfApplicationDeploymentMap,
  ENTITY_MIROIR_SECRET_UUID,
  hydrateSecrets,
  identityDirectoryFromInstances,
  issueBearerToken,
  LoggerOptions,
  MiroirActivityTracker,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  registerSecrets,
  resetAndInitApplicationDeployment,
  resetIntegTestbed,
  resolveSecret,
  RestClientStub,
  setProcessTokenSecret,
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
  RUN_TEST === "secretsPrincipal.270" ||
  RUN_TEST.startsWith("secretsPrincipal.270") ||
  RUN_TEST === "secretsPrincipal.270.phase4";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const USER_DIR = join(ADMIN_DATA, "d20d09e5-0685-4fc7-b9bd-fcfa3845127a");
const CREDENTIAL_DIR = join(ADMIN_DATA, "6c3ab489-1a36-4981-b5d0-bb3e02cfceed");
const EMULATED_SECRET_DIR = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/tests/assets/admin_data/a96856df-2b38-494a-8027-82617e2d64ad",
);
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures");
const PLAYLIST_OK = JSON.parse(readFileSync(join(FIXTURES_DIR, "playlist-ok.json"), "utf8")) as {
  name: string;
  tracks: { total: number };
};

const PLAYLIST_NAME_LITERAL = "Rock Classics";
const PLAYLIST_ID_OK = "test-playlist-001";
const TEST_ENDPOINT_AC_UUID = "e4b1c2d3-5a6f-4e80-9c17-3d8a7b6c5e40";
const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const COMPOSITE_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const WRAPPING_KEY = "test-secrets-master";
const TEST_SECRET = "test-secret-270";
const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const CAROL_UUID = "30634877-08ae-44f3-a230-d899e22333d5";
const ALICE_ONLY_NAME = "aliceOnlyRefresh";
const REFRESH_NAME = "fakeRefreshToken";
const ALICE_RT = "alice-rt";
const CAROL_RT = "carol-rt";
const PROCESS_RT = "process-rt";

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
const fileName = "secretsPrincipal.270.phase4.integ.test";

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
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
let stub: RestClientStub;
let fakeServer: FakeExternalServiceServer;
let aliceToken: string;
let carolToken: string;
let alicePrincipal: { miroirUserUuid: string; username: string };

function readJsonDir(dir: string): Record<string, unknown>[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

function leftoverSecretJsonFiles(): string[] {
  return readdirSync(EMULATED_SECRET_DIR).filter((name) => name.endsWith(".json"));
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function testAuthorizationCodeEndpointInstance(baseUrl: string): EndpointDefinition {
  return {
    uuid: TEST_ENDPOINT_AC_UUID,
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: selfApplicationLibrary.uuid,
    name: "FakeSpotifyAuthorizationCodeSlice4",
    version: "1",
    description: "Slice 4 principal-scoped refresh-token endpoint against the local fake server",
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
          refreshTokenKey: REFRESH_NAME,
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

function boxedGetPlaylistQuery() {
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
            endpointUuid: TEST_ENDPOINT_AC_UUID,
            actionType: "get-playlist",
            parameterBindings: { playlist_id: PLAYLIST_ID_OK },
          },
        },
      },
    },
  };
}

function tokenRequestBodies(): string[] {
  return fakeServer.receivedRequests
    .filter((request) => request.path === "/api/token")
    .map((request) => request.body ?? "");
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

async function deleteAllSecretRows(): Promise<void> {
  const remaining = await querySecretRows();
  for (const row of remaining) {
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
              uuid: String(row.uuid ?? ""),
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

async function hydrateFromStore(): Promise<void> {
  const rows = await querySecretRows();
  clearSecrets();
  hydrateSecrets({ wrappingKey: WRAPPING_KEY, rows });
  registerSecrets({
    fakeClientId: "id-123",
    fakeClientSecret: "secret-abc",
  });
}

async function postSecret(
  token: string,
  body: { name: string; value: string; scope: "process" | "user"; miroirUser?: string },
) {
  return stub.call("/secrets", "post", "/secrets", {
    body,
    headers: authHeaders(token),
  });
}

async function queryPlaylistViaStub(token: string) {
  return stub.call("/query", "post", "/query", {
    body: {
      action: boxedGetPlaylistQuery(),
      applicationDeploymentMap,
    },
    headers: authHeaders(token),
  });
}

function expectPlaylistOk(result: unknown): void {
  const failed =
    result instanceof Action2Error ||
    (result && typeof result === "object" && (result as { status?: string }).status === "error");
  expect(failed, JSON.stringify(result)).toBe(false);
  const playlist = (result as { returnedDomainElement?: { playlist?: { name?: string } } })
    .returnedDomainElement?.playlist;
  expect(playlist?.name).toBe(PLAYLIST_NAME_LITERAL);
}

async function commitAuthorizationCodeEndpoint(): Promise<void> {
  const createResult = await domainController.handleAction(
    {
      actionType: "createInstance",
      endpoint: INSTANCE_ENDPOINT,
      payload: {
        application: selfApplicationLibrary.uuid,
        applicationSection: "model",
        objects: [testAuthorizationCodeEndpointInstance(fakeServer.baseUrl) as EntityInstance],
      },
    },
    applicationDeploymentMap,
    defaultLibraryModelEnvironment,
  );
  expect(
    createResult instanceof Action2Error,
    `createInstance failed: ${JSON.stringify(createResult)}`,
  ).toBe(false);

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
      "secretsPrincipal.270.phase4 requires emulateServer: true (in-process server path).",
    );
  }

  fakeServer = await startFakeExternalServiceServer({
    [`GET /playlists/${PLAYLIST_ID_OK}`]: { body: PLAYLIST_OK },
    "POST /api/token": {
      body: { access_token: "slice4-access", token_type: "Bearer", expires_in: 3600 },
    },
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
  persistenceStoreControllerManager = executionEnvironment.persistenceStoreControllerManager;

  await resetAndInitApplicationDeployment(domainController, applicationDeploymentMap, [
    deployment_Miroir as Deployment,
  ]);

  const directory = identityDirectoryFromInstances(
    readJsonDir(USER_DIR),
    readJsonDir(CREDENTIAL_DIR),
  );
  const alice = directory.users.find((user) => user.username === "alice");
  const carol = directory.users.find((user) => user.username === "carol");
  if (!alice || alice.uuid !== ALICE_UUID) {
    throw new Error("expected real Admin alice user seed");
  }
  if (!carol || carol.uuid !== CAROL_UUID) {
    throw new Error("expected real Admin carol user seed");
  }
  alicePrincipal = { miroirUserUuid: alice.uuid, username: alice.username };
  setProcessTokenSecret(TEST_SECRET);
  aliceToken = await issueBearerToken(alicePrincipal, TEST_SECRET);
  carolToken = await issueBearerToken(
    { miroirUserUuid: carol.uuid, username: carol.username },
    TEST_SECRET,
  );

  stub = new RestClientStub("http://test");
  stub.setServerDomainController(domainControllerForServer);
  stub.setPersistenceStoreControllerManager(persistenceStoreControllerManager);
  stub.setIdentityDirectory(directory);
}, 60000);

beforeEach(async () => {
  if (!shouldRun || !stub) {
    return;
  }
  fakeServer.receivedRequests.length = 0;
  clearExternalServiceTokenCacheForTests();
  clearSecrets();
  clearSecretsMasterKey();
  setSecretsMasterKey(WRAPPING_KEY);
  setProcessTokenSecret(TEST_SECRET);
  await deleteAllSecretRows();
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
  await commitAuthorizationCodeEndpoint();
}, 60000);

afterEach(async () => {
  if (!shouldRun || !stub) {
    return;
  }
  await deleteAllSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
  clearExternalServiceTokenCacheForTests();
});

afterAll(async () => {
  if (!shouldRun || !stub) {
    return;
  }
  await deleteAllSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
  clearAllowedInsecureBaseUrlsForTests();
  expect(leftoverSecretJsonFiles()).toEqual([]);
  if (fakeServer) {
    await fakeServer.close();
  }
});

describe.skipIf(!shouldRun).sequential(
  "secretsPrincipal.270.phase4 — per-user secrets + principal OAuth cache",
  () => {
    it("Alice user POST is stored as Alice; Carol cannot list or overwrite it", async () => {
      const posted = await postSecret(aliceToken, {
        name: ALICE_ONLY_NAME,
        value: ALICE_RT,
        scope: "user",
      });
      expect(posted.status).toBe(200);
      expect(posted.data).toEqual({ set: true });

      const rows = await querySecretRows();
      const aliceRow = rows.find((row) => row.name === ALICE_ONLY_NAME);
      expect(aliceRow).toBeDefined();
      expect(aliceRow?.miroirUser).toBe(ALICE_UUID);

      const carolList = await stub.call("/secrets", "get", "/secrets", {
        headers: authHeaders(carolToken),
      });
      expect(carolList.status).toBe(200);
      const listed = (carolList.data as { secrets?: Array<{ name?: string; scope?: string }> })
        .secrets;
      expect(listed?.some((secret) => secret.name === ALICE_ONLY_NAME)).toBe(false);

      const overwrite = await postSecret(carolToken, {
        name: ALICE_ONLY_NAME,
        value: "carol-overwrite",
        scope: "user",
        miroirUser: ALICE_UUID,
      });
      expect(overwrite.status).toBe(403);
      const afterOverwrite = await querySecretRows();
      expect(
        afterOverwrite.some(
          (row) => row.name === ALICE_ONLY_NAME && row.miroirUser === ALICE_UUID,
        ),
      ).toBe(true);
      expect(
        afterOverwrite.some(
          (row) => row.name === ALICE_ONLY_NAME && row.miroirUser === CAROL_UUID,
        ),
      ).toBe(false);
    });

    it("Alice-warmed OAuth cache does not serve Carol; Carol exchanges carol-rt", async () => {
      expect((await postSecret(aliceToken, { name: REFRESH_NAME, value: ALICE_RT, scope: "user" })).status).toBe(
        200,
      );
      expect((await postSecret(carolToken, { name: REFRESH_NAME, value: CAROL_RT, scope: "user" })).status).toBe(
        200,
      );
      await hydrateFromStore();

      const aliceQuery = await queryPlaylistViaStub(aliceToken);
      expect(aliceQuery.status).toBe(200);
      expectPlaylistOk(aliceQuery.data);
      const afterAlice = tokenRequestBodies();
      expect(afterAlice.length).toBe(1);
      expect(afterAlice[0]).toContain("grant_type=refresh_token");
      expect(afterAlice[0]).toContain(`refresh_token=${ALICE_RT}`);
      expect(afterAlice[0]).not.toContain(CAROL_RT);

      const carolQuery = await queryPlaylistViaStub(carolToken);
      expect(carolQuery.status).toBe(200);
      expectPlaylistOk(carolQuery.data);
      const afterCarol = tokenRequestBodies();
      expect(afterCarol.length).toBe(2);
      expect(afterCarol[1]).toContain("grant_type=refresh_token");
      expect(afterCarol[1]).toContain(`refresh_token=${CAROL_RT}`);
      expect(afterCarol[1]).not.toContain(ALICE_RT);
      expect(afterCarol.some((body) => body.includes(ALICE_RT))).toBe(true);
    });

    it("POST /query with Alice Bearer resolves the user-scoped refresh token", async () => {
      expect((await postSecret(aliceToken, { name: REFRESH_NAME, value: ALICE_RT, scope: "user" })).status).toBe(
        200,
      );
      expect(
        (await postSecret(aliceToken, { name: REFRESH_NAME, value: PROCESS_RT, scope: "process" }))
          .status,
      ).toBe(200);
      await hydrateFromStore();

      const queried = await queryPlaylistViaStub(aliceToken);
      expect(queried.status).toBe(200);
      expectPlaylistOk(queried.data);
      expect(tokenRequestBodies()[0]).toContain(`refresh_token=${ALICE_RT}`);
      expect(tokenRequestBodies()[0]).not.toContain(PROCESS_RT);

      expect(resolveSecret(REFRESH_NAME, alicePrincipal)).toEqual({
        value: ALICE_RT,
        scope: "user",
        miroirUserUuid: ALICE_UUID,
        source: "row",
      });
    });

    it("no principal resolves only process-scoped rows", async () => {
      expect((await postSecret(aliceToken, { name: REFRESH_NAME, value: ALICE_RT, scope: "user" })).status).toBe(
        200,
      );
      expect(
        (await postSecret(aliceToken, { name: REFRESH_NAME, value: PROCESS_RT, scope: "process" }))
          .status,
      ).toBe(200);
      await hydrateFromStore();

      expect(resolveSecret(REFRESH_NAME)).toEqual({
        value: PROCESS_RT,
        scope: "process",
        source: "row",
      });

      const queryResult = await domainControllerForServer.handleBoxedExtractorOrQueryAction(
        boxedGetPlaylistQuery(),
        applicationDeploymentMap,
        defaultMetaModelEnvironment,
      );
      expectPlaylistOk(queryResult);
      expect(tokenRequestBodies()[0]).toContain(`refresh_token=${PROCESS_RT}`);
      expect(tokenRequestBodies()[0]).not.toContain(ALICE_RT);
    });

    it("handleAction compositeRunBoxedQueryAction forwards the outer principal", async () => {
      expect((await postSecret(aliceToken, { name: REFRESH_NAME, value: ALICE_RT, scope: "user" })).status).toBe(
        200,
      );
      expect(
        (await postSecret(aliceToken, { name: REFRESH_NAME, value: PROCESS_RT, scope: "process" }))
          .status,
      ).toBe(200);
      await hydrateFromStore();

      const compositeResult = await domainControllerForServer.handleAction(
        {
          actionType: "compositeRunBoxedQueryAction",
          endpoint: COMPOSITE_ENDPOINT,
          nameGivenToResult: "playlist",
          payload: boxedGetPlaylistQuery(),
        },
        applicationDeploymentMap,
        defaultLibraryModelEnvironment,
        undefined,
        undefined,
        alicePrincipal,
      );
      expectPlaylistOk(compositeResult);
      expect(tokenRequestBodies()[0]).toContain(`refresh_token=${ALICE_RT}`);
      expect(tokenRequestBodies()[0]).not.toContain(PROCESS_RT);
    });
  },
);
