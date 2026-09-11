// @vitest-environment node
/**
 * #270 Slice 2 — authenticated /secrets HTTP persist + generic CRUD guard.
 *
 * Run:
 * ```bash
 * RUN_TEST=secretsHttp.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsHttp.270
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
  EntityInstance,
  PersistenceStoreControllerManagerInterface,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  Action2Error,
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
  resetAndInitApplicationDeployment,
  resolveSecret,
  RestClientStub,
  clearSecrets,
  clearSecretsMasterKey,
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
import { deployment_Library_DO_NO_USE, selfApplicationLibrary } from "miroir-test-app_deployment-library";

import { loglevelnext } from "../../../../src/loglevelnextImporter.js";
import { miroirAppStartup } from "../../../../src/startup.js";
import { AppStackIntegrationTestSession } from "../../../helpers/IntegrationTestSession.js";
import { loadTestConfigFiles } from "../../../utils/fileTools.js";
import { cleanLevel, packageName } from "../../constants.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "secretsHttp.270" ||
  RUN_TEST.startsWith("secretsHttp.270") ||
  RUN_TEST === "secretsHttp.270.phase2";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const USER_DIR = join(ADMIN_DATA, "d20d09e5-0685-4fc7-b9bd-fcfa3845127a");
const CREDENTIAL_DIR = join(ADMIN_DATA, "6c3ab489-1a36-4981-b5d0-bb3e02cfceed");
const EMULATED_SECRET_DIR = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/tests/assets/admin_data/a96856df-2b38-494a-8027-82617e2d64ad",
);

const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const WRAPPING_KEY = "test-secrets-master";
const TEST_SECRET = "test-secret-270";
const PROCESS_SECRET_NAME = "slice2ProcessSecret";
const PROCESS_SECRET_VALUE = "slice2-process-value";
const CAROL = "30634877-08ae-44f3-a230-d899e22333d5";

const env: any = process.env;
const { miroirConfig, logConfig: importedLoggerOptions } = await loadTestConfigFiles(env);
if (!miroirConfig) {
  throw new Error("miroirConfig is undefined");
}
if (!importedLoggerOptions) {
  throw new Error("importedLoggerOptions is undefined");
}
const loggerOptions: LoggerOptions = importedLoggerOptions;
const fileName = "secretsHttp.270.phase2.integ.test";

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

let domainControllerForServer: DomainControllerInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
let stub: RestClientStub;
let aliceToken: string;

function readJsonDir(dir: string): Record<string, unknown>[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

function leftoverSecretJsonFiles(): string[] {
  return readdirSync(EMULATED_SECRET_DIR).filter((name) => name.endsWith(".json"));
}

function authHeaders() {
  return { Authorization: `Bearer ${aliceToken}` };
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

beforeAll(async () => {
  if (!shouldRun) {
    return;
  }
  if (!miroirConfig.client.emulateServer) {
    throw new Error("secretsHttp.270.phase2 requires emulateServer: true (in-process server path).");
  }

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
  if (!executionEnvironment.domainControllerForServer) {
    throw new Error("domainControllerForServer missing from executionEnvironment");
  }
  domainControllerForServer = executionEnvironment.domainControllerForServer;
  persistenceStoreControllerManager = executionEnvironment.persistenceStoreControllerManager;

  await resetAndInitApplicationDeployment(
    executionEnvironment.domainController,
    applicationDeploymentMap,
    [deployment_Miroir as Deployment],
  );

  const directory = identityDirectoryFromInstances(
    readJsonDir(USER_DIR),
    readJsonDir(CREDENTIAL_DIR),
  );
  const alice = directory.users.find((user) => user.username === "alice");
  if (!alice || !directory.credentials.some((row) => row.miroirUser === alice.uuid)) {
    throw new Error("expected real Admin alice user + credential seeds");
  }
  setProcessTokenSecret(TEST_SECRET);
  // standalone-app vitest polyfills node:crypto; scrypt is not callable, so
  // loginWithPassword cannot verify alice-dev here. Token is minted for the
  // real Alice principal (password path remains authentication.71).
  aliceToken = await issueBearerToken(
    { miroirUserUuid: alice.uuid, username: alice.username },
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
  clearSecrets();
  clearSecretsMasterKey();
  setSecretsMasterKey(WRAPPING_KEY);
  setProcessTokenSecret(TEST_SECRET);
  await deleteAllSecretRows();
}, 60000);

afterEach(async () => {
  if (!shouldRun || !stub) {
    return;
  }
  await deleteAllSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
});

afterAll(async () => {
  if (!shouldRun || !stub) {
    return;
  }
  await deleteAllSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
  expect(leftoverSecretJsonFiles()).toEqual([]);
});

describe.skipIf(!shouldRun).sequential("secretsHttp.270.phase2 — /secrets HTTP + CRUD guard", () => {
  it("Alice POST process-scope persists; hydrate resolve returns source row", async () => {
    const posted = await stub.call("/secrets", "post", "/secrets", {
      body: { name: PROCESS_SECRET_NAME, value: PROCESS_SECRET_VALUE, scope: "process" },
      headers: authHeaders(),
    });
    expect(posted.status).toBe(200);
    expect(posted.data).toEqual({ set: true });

    const rows = await querySecretRows();
    expect(rows.some((row) => row.name === PROCESS_SECRET_NAME)).toBe(true);
    clearSecrets();
    hydrateSecrets({ wrappingKey: WRAPPING_KEY, rows });
    expect(resolveSecret(PROCESS_SECRET_NAME)).toEqual({
      value: PROCESS_SECRET_VALUE,
      scope: "process",
      source: "row",
    });
  });

  it("GET /secrets returns names only, no value or ciphertext", async () => {
    await stub.call("/secrets", "post", "/secrets", {
      body: { name: PROCESS_SECRET_NAME, value: PROCESS_SECRET_VALUE, scope: "process" },
      headers: authHeaders(),
    });
    const listed = await stub.call("/secrets", "get", "/secrets", { headers: authHeaders() });
    expect(listed.status).toBe(200);
    expect(listed.data).toEqual({
      secrets: [{ name: PROCESS_SECRET_NAME, scope: "process" }],
    });
    const serialized = JSON.stringify(listed.data);
    expect(serialized).not.toContain(PROCESS_SECRET_VALUE);
    expect(serialized).not.toMatch(/"value"\s*:/);
    expect(serialized).not.toContain("ciphertext");
  });

  it("generic unlabeled MiroirSecret CRUD is rejected on the server DC", async () => {
    const dummy = {
      uuid: "270a0002-2b38-494a-8027-82617e2d64ad",
      parentName: "MiroirSecret",
      parentUuid: ENTITY_MIROIR_SECRET_UUID,
      name: "unlabeled",
    } as EntityInstance;
    for (const actionType of [
      "createInstance",
      "updateInstance",
      "deleteInstance",
      "deleteInstanceWithCascade",
    ] as const) {
      const result = await domainControllerForServer.handleAction(
        {
          actionType,
          endpoint: INSTANCE_ENDPOINT,
          payload: {
            application: ADMIN_APPLICATION_UUID,
            applicationSection: "data",
            objects: [dummy],
          },
        },
        applicationDeploymentMap,
        defaultMetaModelEnvironment,
      );
      expect(result instanceof Action2Error, `${actionType} should be rejected`).toBe(true);
    }
  });

  it("DELETE /secrets removes the row; resolve fails closed after hydrate", async () => {
    await stub.call("/secrets", "post", "/secrets", {
      body: { name: PROCESS_SECRET_NAME, value: PROCESS_SECRET_VALUE, scope: "process" },
      headers: authHeaders(),
    });
    const deleted = await stub.call("/secrets", "delete", "/secrets", {
      body: { name: PROCESS_SECRET_NAME, scope: "process" },
      headers: authHeaders(),
    });
    expect(deleted.status).toBe(200);
    expect(deleted.data).toEqual({ deleted: true });

    const rows = await querySecretRows();
    expect(rows.some((row) => row.name === PROCESS_SECRET_NAME)).toBe(false);
    clearSecrets();
    hydrateSecrets({ wrappingKey: WRAPPING_KEY, rows });
    expect(() => resolveSecret(PROCESS_SECRET_NAME)).toThrow(/Unknown or empty secret/);
  });

  it("user-scope POST without matching principal is rejected", async () => {
    const rejected = await stub.call("/secrets", "post", "/secrets", {
      body: {
        name: "aliceTryingCarol",
        value: "nope",
        scope: "user",
        miroirUser: CAROL,
      },
      headers: authHeaders(),
    });
    expect(rejected.status).toBe(403);
    const rows = await querySecretRows();
    expect(rows.some((row) => row.name === "aliceTryingCarol")).toBe(false);
  });
});
