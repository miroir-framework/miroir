/**
 * #270 Slice 7 — `?page=secrets` form posts to the real /secrets stub (P16).
 *
 * Vehicle: emulated-stack + Testing Library (MemoryRouter, same as LoginPage).
 * `globalThis.fetch` forwards `/secrets` only to the Slice 2 test-local RestClientStub.
 *
 * Run:
 * ```bash
 * RUN_TEST=secretsPage.270 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem secretsPage.270
 * ```
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type {
  ApplicationDeploymentMap,
  Deployment,
  DomainControllerInterface,
  EntityInstance,
  HttpMethod,
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
import { setAuthToken } from "../../../../src/miroir-fwk/4_view/auth/authSession.js";
import { SecretsPage } from "../../../../src/miroir-fwk/4_view/routes/SecretsPage.js";
import { miroirAppStartup } from "../../../../src/startup.js";
import { AppStackIntegrationTestSession } from "../../../helpers/IntegrationTestSession.js";
import { loadTestConfigFiles } from "../../../utils/fileTools.js";
import { cleanLevel, packageName } from "../../../3_controllers/constants.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "secretsPage.270" ||
  RUN_TEST.startsWith("secretsPage.270") ||
  RUN_TEST === "secretsPage.270.phase7";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-test-app_deployment-admin/assets/admin_data");
const USER_DIR = join(ADMIN_DATA, "d20d09e5-0685-4fc7-b9bd-fcfa3845127a");
const CREDENTIAL_DIR = join(ADMIN_DATA, "6c3ab489-1a36-4981-b5d0-bb3e02cfceed");
const EMULATED_SECRET_DIR = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/tests/assets/admin_data/a96856df-2b38-494a-8027-82617e2d64ad",
);
const ADMIN_MENU = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json",
);
const PAGE_DISPATCHER = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/src/miroir-fwk/4_view/PageDispatcher.tsx",
);

const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const ADMIN_APPLICATION_UUID = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const WRAPPING_KEY = "test-secrets-master";
const TEST_SECRET = "test-secret-270";
const PROCESS_SECRET_NAME = "slice7ProcessSecret";
const PROCESS_SECRET_VALUE = "slice7-process-value";

const env: any = process.env;
const { miroirConfig, logConfig: importedLoggerOptions } = await loadTestConfigFiles(env);
if (!miroirConfig) {
  throw new Error("miroirConfig is undefined");
}
if (!importedLoggerOptions) {
  throw new Error("importedLoggerOptions is undefined");
}
const loggerOptions: LoggerOptions = importedLoggerOptions;
const fileName = "secretsPage.270.phase7.integ.test";

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
let restoreFetch: (() => void) | undefined;
let lastSecretsHttp: { status: number; data: unknown } | undefined;

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

function headerRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function isSecretsPath(url: string): boolean {
  try {
    const pathname = new URL(url, "http://local.test").pathname.replace(/\/+$/, "") || "/";
    return pathname === "/secrets" || pathname.endsWith("/secrets");
  } catch {
    const pathname = (url.split("?")[0] ?? url).replace(/\/+$/, "") || "/";
    return pathname === "/secrets" || pathname.endsWith("/secrets");
  }
}

function installSecretsFetchForward(target: RestClientStub): () => void {
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    if (!isSecretsPath(url)) {
      return originalFetch(input, init);
    }
    const method = String(
      init?.method ??
        (typeof input === "object" && !(input instanceof URL) && "method" in input
          ? input.method
          : "GET"),
    ).toLowerCase() as HttpMethod;
    const headers = headerRecord(
      init?.headers ??
        (typeof input === "object" && !(input instanceof URL) && "headers" in input
          ? input.headers
          : undefined),
    );
    let body: unknown;
    const rawBody = init?.body;
    if (typeof rawBody === "string" && rawBody.length > 0) {
      body = JSON.parse(rawBody);
    }
    const result = await target.call("/secrets", method, "/secrets", { body, headers });
    lastSecretsHttp = { status: result.status, data: result.data };
    return new Response(JSON.stringify(result.data), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

function renderSecretsPage() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={["/?page=secrets"]}
    >
      <SecretsPage />
    </MemoryRouter>,
  );
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
    await stub.call("/secrets", "delete", "/secrets", {
      body: {
        name: String(row.name ?? ""),
        scope: row.miroirUser ? "user" : "process",
      },
      headers: authHeaders(),
    });
  }
}

beforeAll(async () => {
  if (!shouldRun) {
    return;
  }
  if (!miroirConfig.client.emulateServer) {
    throw new Error("secretsPage.270.phase7 requires emulateServer: true (in-process server path).");
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
  setAuthToken(aliceToken);
  lastSecretsHttp = undefined;
  restoreFetch = installSecretsFetchForward(stub);
  await deleteAllSecretRows();
}, 60000);

afterEach(async () => {
  cleanup();
  restoreFetch?.();
  restoreFetch = undefined;
  setAuthToken(undefined);
  if (!shouldRun || !stub) {
    return;
  }
  await deleteAllSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
});

afterAll(async () => {
  restoreFetch?.();
  setAuthToken(undefined);
  if (!shouldRun || !stub) {
    return;
  }
  await deleteAllSecretRows();
  clearSecrets();
  clearSecretsMasterKey();
  expect(leftoverSecretJsonFiles()).toEqual([]);
});

describe.skipIf(!shouldRun).sequential("secretsPage.270.phase7 — ?page=secrets UI", () => {
  it("/?page=secrets shows name, value, and scope controls", async () => {
    renderSecretsPage();
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^value$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^scope$/i)).toBeInTheDocument();
    const scope = screen.getByLabelText(/^scope$/i);
    expect(scope).toHaveDisplayValue(/process/i);
    expect(screen.getByRole("option", { name: /^user$/i })).toBeInTheDocument();
  });

  it("submit process-scope secret POSTs to the stub; success UI hides the value; hydrate resolve is row", async () => {
    const user = userEvent.setup();
    renderSecretsPage();

    await user.type(screen.getByLabelText(/^name$/i), PROCESS_SECRET_NAME);
    await user.type(screen.getByLabelText(/^value$/i), PROCESS_SECRET_VALUE);
    await user.selectOptions(screen.getByLabelText(/^scope$/i), "process");
    await user.click(screen.getByRole("button", { name: /set/i }));

    await waitFor(() => {
      expect(lastSecretsHttp).toEqual({ status: 200, data: { set: true } });
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^value$/i)).toHaveValue("");
    });
    expect(document.body.textContent ?? "").not.toContain(PROCESS_SECRET_VALUE);
    const confirmation = screen.getByRole("status");
    expect(confirmation).toHaveTextContent(new RegExp(`${PROCESS_SECRET_NAME}\\s+set`, "i"));
    expect(confirmation).not.toHaveTextContent(PROCESS_SECRET_VALUE);

    const listed = await stub.call("/secrets", "get", "/secrets", { headers: authHeaders() });
    expect(listed.status).toBe(200);
    expect(listed.data).toEqual({
      secrets: [{ name: PROCESS_SECRET_NAME, scope: "process" }],
    });
    expect(JSON.stringify(listed.data)).not.toContain(PROCESS_SECRET_VALUE);

    const rows = await querySecretRows();
    clearSecrets();
    hydrateSecrets({ wrappingKey: WRAPPING_KEY, rows });
    expect(resolveSecret(PROCESS_SECRET_NAME)).toEqual({
      value: PROCESS_SECRET_VALUE,
      scope: "process",
      source: "row",
    });
  });

  it("Admin menu has a Secrets list report; query-param page still serves SecretsPage", () => {
    const menu = JSON.parse(readFileSync(ADMIN_MENU, "utf8")) as {
      definition?: {
        definition?: Array<{
          title?: string;
          items?: Array<{
            label?: string;
            miroirMenuItemType?: string;
            reportUuid?: string;
            targetRoot?: string;
          }>;
        }>;
      };
    };
    const adminSection = menu.definition?.definition?.find((section) => section.title === "Admin");
    const items = adminSection?.items ?? [];
    expect(items).toHaveLength(9);
    const secretsItem = items.find((item) => item.label === "Secrets");
    expect(secretsItem).toMatchObject({
      miroirMenuItemType: "miroirMenuReportLink",
      reportUuid: "288c9faf-c92e-49a4-b535-99ed7bb01793",
    });
    expect(secretsItem?.targetRoot).toBeUndefined();

    const dispatcherSrc = readFileSync(PAGE_DISPATCHER, "utf8");
    const queryParamStart = dispatcherSrc.indexOf("Primary: query-param mode");
    const fallbackStart = dispatcherSrc.indexOf("Fallback: legacy path-segment");
    expect(queryParamStart).toBeGreaterThan(-1);
    expect(fallbackStart).toBeGreaterThan(queryParamStart);
    const queryParamSwitch = dispatcherSrc.slice(queryParamStart, fallbackStart);
    expect(queryParamSwitch).toMatch(/case\s+"secrets"\s*:/);
    expect(queryParamSwitch).toMatch(/<\s*SecretsPage\s*\/>/);

    const pathSegmentSwitch = dispatcherSrc.slice(fallbackStart);
    expect(pathSegmentSwitch).not.toMatch(/case\s+"secrets"/);
  });
});
