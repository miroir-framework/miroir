// #263 Slice 5: the Electron main process answers `miroir-ipc` as a platform user when
// authentication is on. vitest, not MiroirTest: main-process wiring (handleMiroirIpc has no
// `electron` import), booted on test-filesystem like a desktop start.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

import { miroirCoreStartup, RestClientStub, ELECTRON_LOOPBACK_ROOT_API_URL } from "miroir-core";
import { openTestEnvironment } from "miroir-env";

import { bootElectronServer, type ElectronServer } from "../../../../src/environmentBoot";
import { electronAuthenticationGates, handleMiroirIpc, type MiroirIpcDeps } from "../../../../src/miroirIpcHandler";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const ADMIN_APP = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const ENTITY_MIROIR_USER = "d20d09e5-0685-4fc7-b9bd-fcfa3845127a";
const ENTITY_BOOK = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";

let server: ElectronServer;

function depsFor(env: Record<string, string | undefined>, argv: string[] = []): MiroirIpcDeps {
  const { gate } = electronAuthenticationGates({
    argv,
    env,
    serverConfig: server.serverConfig,
    domainController: server.domainController,
    applicationDeploymentMap: server.applicationDeploymentMap,
  });
  const restClientStub = new RestClientStub(ELECTRON_LOOPBACK_ROOT_API_URL);
  restClientStub.setServerDomainController(server.domainController);
  restClientStub.setPersistenceStoreControllerManager(server.persistenceStoreControllerManager);
  restClientStub.setAuthenticationGate(gate);
  return {
    restClientStub,
    domainController: server.domainController,
    gate,
    clientConfig: server.clientConfig,
    environmentRoot: server.environment.repositoryRoot,
  };
}

/** A storage query on one entity of one application, as the renderer's proxy sends it. */
function serverQuery(application: string, deployment: string, entity: string, authorization?: string) {
  return {
    type: "server-query",
    authorization,
    applicationDeploymentMap: { ...server.applicationDeploymentMap, [application]: deployment },
    action: {
      actionType: "runBoxedQueryAction",
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      payload: {
        application,
        applicationSection: "data",
        queryExecutionStrategy: "storage",
        query: {
          application,
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          extractors: { rows: { extractorOrCombinerType: "extractorInstancesByEntity", parentUuid: entity } },
        },
      },
    },
  };
}

async function login(deps: MiroirIpcDeps, username: string, password: string) {
  return handleMiroirIpc(
    { type: "rest-call", rawUrl: "/auth/login", method: "post", endpoint: "/auth/login", args: { body: { username, password } } },
    deps,
  );
}

describe("#263 Electron miroir-ipc with authentication", () => {
  beforeAll(async () => {
    miroirCoreStartup();
    openTestEnvironment("test-filesystem", { reseed: true });
    server = await bootElectronServer({ cwd: REPO_ROOT, env: { ...process.env, MIROIR_ENV: "test-filesystem" } }, () => {});
  });

  it("refuses a query without a principal", async () => {
    const deps = depsFor({ MIROIR_AUTH_ENABLED: "1" });
    const result = await handleMiroirIpc(serverQuery(LIBRARY_APP, LIBRARY_DEPLOYMENT, ENTITY_BOOK), deps);
    expect(result).toMatchObject({ status: "error", errorType: "AuthenticationRequired" });
  });

  it("logs alice in over rest-call, then runs her Library query", async () => {
    const deps = depsFor({ MIROIR_AUTH_ENABLED: "1" });
    const loggedIn = await login(deps, "alice", "alice-dev");
    expect(loggedIn.status).toBe(200);
    const result = await handleMiroirIpc(
      serverQuery(LIBRARY_APP, LIBRARY_DEPLOYMENT, ENTITY_BOOK, `Bearer ${loggedIn.data.token}`),
      deps,
    );
    expect(result.status).toBe("ok");
  });

  it("denies carol Library, allows her Admin", async () => {
    const deps = depsFor({ MIROIR_AUTH_ENABLED: "1" });
    const loggedIn = await login(deps, "carol", "carol-dev");
    const bearer = `Bearer ${loggedIn.data.token}`;
    expect(await handleMiroirIpc(serverQuery(LIBRARY_APP, LIBRARY_DEPLOYMENT, ENTITY_BOOK, bearer), deps)).toMatchObject({
      status: "error",
      errorType: "AccessDenied",
    });
    expect((await handleMiroirIpc(serverQuery(ADMIN_APP, ADMIN_DEPLOYMENT, ENTITY_MIROIR_USER, bearer), deps)).status).toBe("ok");
  });

  it("does not tell an inactive user from a wrong password", async () => {
    const deps = depsFor({ MIROIR_AUTH_ENABLED: "1" });
    const bob = await login(deps, "bob", "bob-dev");
    const wrong = await login(deps, "alice", "wrong");
    expect(bob.status).toBe(401);
    expect(bob.data).toEqual(wrong.data);
  });

  it("reports the main process's hatch on /auth/status, and gives the client configuration without login", async () => {
    const on = depsFor({ MIROIR_AUTH_ENABLED: "1" });
    const off = depsFor({}, ["--disable-auth"]);
    const status = (deps: MiroirIpcDeps) =>
      handleMiroirIpc({ type: "rest-call", rawUrl: "/auth/status", method: "get", endpoint: "/auth/status", args: {} }, deps);
    expect((await status(on)).data).toEqual({ enabled: true });
    expect((await status(off)).data).toEqual({ enabled: false });
    expect(await handleMiroirIpc({ type: "get-client-config" }, on)).toBe(server.clientConfig);
  });

  it("runs queries without identity when the hatch is off", async () => {
    const deps = depsFor({ MIROIR_AUTH_ENABLED: "0" });
    expect((await handleMiroirIpc(serverQuery(LIBRARY_APP, LIBRARY_DEPLOYMENT, ENTITY_BOOK), deps)).status).toBe("ok");
  });
});
