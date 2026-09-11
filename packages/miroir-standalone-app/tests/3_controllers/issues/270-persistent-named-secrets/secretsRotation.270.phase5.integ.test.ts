// @vitest-environment node
/**
 * #270 Slice 5 — persist rotated OAuth refresh token (row-backed only).
 *
 * Run:
 * ```bash
 * RUN_TEST=secretsRotation.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsRotation.270
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
  clearPersistRotatedSecret,
  clearSecrets,
  clearSecretsMasterKey,
  ConfigurationService,
  decryptSecret,
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
  persistRotatedSecretRow,
  registerSecrets,
  resetAndInitApplicationDeployment,
  resetIntegTestbed,
  resolveSecret,
  RestClientStub,
  setPersistRotatedSecret,
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
  RUN_TEST === "secretsRotation.270" ||
  RUN_TEST.startsWith("secretsRotation.270") ||
  RUN_TEST === "secretsRotation.270.phase5";

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
const TEST_ENDPOINT_AC_UUID = "a7c2d8e1-4b5f-4c90-8d26-6e9f0a1b2c33";
const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const MODEL_ENDPOINT = "7947ae40-eb34-4149-887b-15a9021e714e";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const WRAPPING_KEY = "test-secrets-master";
const TEST_SECRET = "test-secret-270";
const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const REFRESH_NAME = "fakeRefreshToken";
const PROCESS_RT = "process-rt";
const ALICE_RT = "alice-rt";
const ROTATED_RT = "rotated-rt";

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
const fileName = "secretsRotation.270.phase5.integ.test";

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

function isProcessRow(row: Record<string, unknown>): boolean {
  return typeof row.miroirUser !== "string" || row.miroirUser === "";
}

function testAuthorizationCodeEndpointInstance(baseUrl: string): EndpointDefinition {
  return {
    uuid: TEST_ENDPOINT_AC_UUID,
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: selfApplicationLibrary.uuid,
    name: "FakeSpotifyAuthorizationCodeSlice5",
    version: "1",
    description: "Slice 5 row-backed refresh-token rotation against the local fake server",
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

function decryptRefreshRow(row: Record<string, unknown> | undefined): string {
  expect(row, "expected a MiroirSecret row").toBeDefined();
  return decryptSecret("aes-256-gcm", WRAPPING_KEY, String(row?.ciphertext ?? ""));
}

function rowForName(
  rows: Record<string, unknown>[],
  name: string,
  scope: "process" | "user",
  miroirUserUuid?: string,
): Record<string, unknown> | undefined {
  return rows.find((row) => {
    if (String(row.name ?? "") !== name) {
      return false;
    }
    if (scope === "process") {
      return isProcessRow(row);
    }
    return !isProcessRow(row) && String(row.miroirUser ?? "") === (miroirUserUuid ?? "");
  });
}

function dumpContainsRotatedRt(value: unknown): boolean {
  try {
    return JSON.stringify(value).includes(ROTATED_RT);
  } catch {
    return String(value).includes(ROTATED_RT);
  }
}

async function captureLogsDuring<T>(fn: () => Promise<T>): Promise<{ result: T; logs: string[] }> {
  const logs: string[] = [];
  const methods = ["log", "info", "warn", "debug", "error", "trace"] as const;
  const originals = methods.map((method) => console[method]);
  const record = (...args: unknown[]) => {
    logs.push(
      args
        .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
        .join(" "),
    );
  };
  for (const method of methods) {
    (console as any)[method] = (...args: unknown[]) => {
      record(...args);
      originals[methods.indexOf(method)].apply(console, args as any);
    };
  }
  try {
    return { result: await fn(), logs };
  } finally {
    methods.forEach((method, index) => {
      (console as any)[method] = originals[index];
    });
  }
}

function wirePersistRotatedSecret(): void {
  setPersistRotatedSecret(async (args) => {
    await persistRotatedSecretRow(domainControllerForServer, args, applicationDeploymentMap);
  });
}

function setRotatingTokenFixture(): void {
  fakeServer.setFixture("POST", "/api/token", {
    body: {
      access_token: "slice5-access",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: ROTATED_RT,
    },
  });
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
      "secretsRotation.270.phase5 requires emulateServer: true (in-process server path).",
    );
  }

  fakeServer = await startFakeExternalServiceServer({
    [`GET /playlists/${PLAYLIST_ID_OK}`]: { body: PLAYLIST_OK },
    "POST /api/token": {
      body: { access_token: "slice5-access", token_type: "Bearer", expires_in: 3600 },
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
  if (!alice || alice.uuid !== ALICE_UUID) {
    throw new Error("expected real Admin alice user seed");
  }
  alicePrincipal = { miroirUserUuid: alice.uuid, username: alice.username };
  setProcessTokenSecret(TEST_SECRET);
  aliceToken = await issueBearerToken(alicePrincipal, TEST_SECRET);

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
  clearPersistRotatedSecret();
  clearSecrets();
  clearSecretsMasterKey();
  setSecretsMasterKey(WRAPPING_KEY);
  setProcessTokenSecret(TEST_SECRET);
  wirePersistRotatedSecret();
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
  clearPersistRotatedSecret();
  clearSecrets();
  clearSecretsMasterKey();
  clearExternalServiceTokenCacheForTests();
});

afterAll(async () => {
  if (!shouldRun || !stub) {
    return;
  }
  await deleteAllSecretRows();
  clearPersistRotatedSecret();
  clearSecrets();
  clearSecretsMasterKey();
  clearAllowedInsecureBaseUrlsForTests();
  expect(leftoverSecretJsonFiles()).toEqual([]);
  if (fakeServer) {
    await fakeServer.close();
  }
});

describe.skipIf(!shouldRun).sequential(
  "secretsRotation.270.phase5 — persist rotated refresh token",
  () => {
    it("process-backed rotation re-encrypts the process row only", async () => {
      expect(
        (await postSecret(aliceToken, { name: REFRESH_NAME, value: PROCESS_RT, scope: "process" }))
          .status,
      ).toBe(200);
      await hydrateFromStore();
      setRotatingTokenFixture();

      const { result: queried, logs } = await captureLogsDuring(() =>
        queryPlaylistViaStub(aliceToken),
      );
      expect(queried.status).toBe(200);
      expectPlaylistOk(queried.data);
      expect(dumpContainsRotatedRt(queried.data)).toBe(false);
      expect(logs.some((line) => line.includes(ROTATED_RT))).toBe(false);

      const rows = await querySecretRows();
      const processRow = rowForName(rows, REFRESH_NAME, "process");
      expect(decryptRefreshRow(processRow)).toBe(ROTATED_RT);
      expect(rowForName(rows, REFRESH_NAME, "user", ALICE_UUID)).toBeUndefined();

      await hydrateFromStore();
      expect(resolveSecret(REFRESH_NAME)).toEqual({
        value: ROTATED_RT,
        scope: "process",
        source: "row",
      });
    });

    it("Alice user-backed rotation re-encrypts Alice's row and leaves the process row", async () => {
      expect(
        (await postSecret(aliceToken, { name: REFRESH_NAME, value: PROCESS_RT, scope: "process" }))
          .status,
      ).toBe(200);
      expect(
        (await postSecret(aliceToken, { name: REFRESH_NAME, value: ALICE_RT, scope: "user" })).status,
      ).toBe(200);
      await hydrateFromStore();
      setRotatingTokenFixture();

      const { result: queried, logs } = await captureLogsDuring(() =>
        queryPlaylistViaStub(aliceToken),
      );
      expect(queried.status).toBe(200);
      expectPlaylistOk(queried.data);
      expect(dumpContainsRotatedRt(queried.data)).toBe(false);
      expect(logs.some((line) => line.includes(ROTATED_RT))).toBe(false);

      const rows = await querySecretRows();
      expect(decryptRefreshRow(rowForName(rows, REFRESH_NAME, "user", ALICE_UUID))).toBe(ROTATED_RT);
      expect(decryptRefreshRow(rowForName(rows, REFRESH_NAME, "process"))).toBe(PROCESS_RT);

      await hydrateFromStore();
      expect(resolveSecret(REFRESH_NAME, alicePrincipal)).toEqual({
        value: ROTATED_RT,
        scope: "user",
        miroirUserUuid: ALICE_UUID,
        source: "row",
      });
      expect(resolveSecret(REFRESH_NAME)).toEqual({
        value: PROCESS_RT,
        scope: "process",
        source: "row",
      });
    });

    it("callback wired + row-backed + wrapping key cleared mid-run fails closed", async () => {
      expect(
        (await postSecret(aliceToken, { name: REFRESH_NAME, value: PROCESS_RT, scope: "process" }))
          .status,
      ).toBe(200);
      await hydrateFromStore();
      setRotatingTokenFixture();
      clearSecretsMasterKey();

      let queried: unknown;
      try {
        queried = await queryPlaylistViaStub(aliceToken);
      } catch (error) {
        queried = error;
      }
      const asHttp = queried as { status?: number; data?: { status?: string } };
      const failedClosed =
        queried instanceof Action2Error ||
        queried instanceof Error ||
        asHttp.status !== 200 ||
        asHttp.data?.status === "error" ||
        (asHttp.data &&
          typeof asHttp.data === "object" &&
          (asHttp.data as { errorType?: string }).errorType !== undefined);
      expect(failedClosed, JSON.stringify(queried)).toBe(true);
      expect(dumpContainsRotatedRt(queried)).toBe(false);

      setSecretsMasterKey(WRAPPING_KEY);
      await hydrateFromStore();
      expect(resolveSecret(REFRESH_NAME)).toEqual({
        value: PROCESS_RT,
        scope: "process",
        source: "row",
      });
      expect(decryptRefreshRow(rowForName(await querySecretRows(), REFRESH_NAME, "process"))).toBe(
        PROCESS_RT,
      );
    });

    it("never logs the new refresh token", async () => {
      expect(
        (await postSecret(aliceToken, { name: REFRESH_NAME, value: PROCESS_RT, scope: "process" }))
          .status,
      ).toBe(200);
      await hydrateFromStore();
      setRotatingTokenFixture();

      const { result: queried, logs } = await captureLogsDuring(() =>
        queryPlaylistViaStub(aliceToken),
      );
      expect(queried.status).toBe(200);
      expectPlaylistOk(queried.data);
      expect(dumpContainsRotatedRt(queried)).toBe(false);
      expect(dumpContainsRotatedRt(queried.data)).toBe(false);
      expect(logs.some((line) => line.includes(ROTATED_RT))).toBe(false);
    });
  },
);
