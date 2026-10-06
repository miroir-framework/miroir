/**
 * #263 Slice 1 — shared gate pieces: the MCP switch, the stub gate a host installs (explicit hatch
 * value + directory loader) and the stub's deployment extraction on action bodies.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ACCESS_DENIED, accessGrantsFromInstances, deploymentsFromInstances } from "../../../../src/1_core/authentication/AccessPolicy.js";
import type { LoadedAccessDirectory } from "../../../../src/1_core/authentication/AccessGate.js";
import {
  identityDirectoryFromInstances,
  issueBearerToken,
  loginWithPassword,
  resolveMcpAuthenticationEnabled,
} from "../../../../src/1_core/authentication/AuthenticationPolicy.js";
import { handleAuthHttpRoute } from "../../../../src/1_core/authentication/AuthenticationHttp.js";
import { RestClientStub } from "../../../../src/4_services/RestClientStub.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("gate.263");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ADMIN_DATA = join(REPO_ROOT, "packages/miroir-app-admin/assets/admin_data");

const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const ADMIN_APP = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const BOB_UUID = "95fa298f-79f8-428c-8980-3443d486c1d8";
const SECRET = "test-secret-263";

function readJsonDir(entityUuid: string): Record<string, unknown>[] {
  const dir = join(ADMIN_DATA, entityUuid);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Record<string, unknown>);
}

function seedDirectory(): LoadedAccessDirectory {
  return {
    directory: identityDirectoryFromInstances(
      readJsonDir("d20d09e5-0685-4fc7-b9bd-fcfa3845127a"),
      readJsonDir("6c3ab489-1a36-4981-b5d0-bb3e02cfceed"),
    ),
    grants: accessGrantsFromInstances(readJsonDir("a6136fc7-949b-4d64-9f13-dd3afce1ab3c")),
    deployments: deploymentsFromInstances(readJsonDir("7959d814-400c-4e80-988f-a00fe582ab98")),
  };
}

async function bearer(username: string): Promise<string> {
  const result = await loginWithPassword(
    { username, password: `${username}-dev` },
    seedDirectory().directory,
    SECRET,
  );
  if (!result.ok) {
    throw new Error(`expected ${username} login to succeed`);
  }
  return `Bearer ${result.token}`;
}

function gatedStub(enabled: boolean): RestClientStub {
  const stub = new RestClientStub("http://test");
  stub.setAuthenticationGate({ enabled, secret: SECRET, loadDirectory: async () => seedDirectory() });
  return stub;
}

/** A query action body as RestPersistenceClientAndRestClient posts it. */
function queryBody(application: string, deployment: string) {
  return {
    action: {
      actionType: "runBoxedQueryAction",
      payload: { application, applicationSection: "data", query: {} },
    },
    applicationDeploymentMap: { [application]: deployment },
  };
}

/** The stub's answer, or `passedGate` when the call reached the handler (no store wired here). */
async function postQuery(stub: RestClientStub, application: string, deployment: string, authorization?: string) {
  try {
    return await stub.call("/query", "post", "/query", {
      body: queryBody(application, deployment),
      headers: authorization ? { Authorization: authorization } : {},
    });
  } catch (error) {
    return { passedGate: true as const, error: String(error) };
  }
}

if (runThis) {
  describe("gate.263.phase1 resolveMcpAuthenticationEnabled", () => {
    it("follows the global hatch when the MCP switch is unset", () => {
      expect(resolveMcpAuthenticationEnabled({ globalEnabled: true })).toBe(true);
      expect(resolveMcpAuthenticationEnabled({ globalEnabled: false })).toBe(false);
    });

    it("global off wins over an MCP switch on", () => {
      expect(
        resolveMcpAuthenticationEnabled({
          globalEnabled: false,
          argv: ["--enable-mcp-auth"],
          env: { MIROIR_MCP_AUTH_ENABLED: "1" },
          config: { mcp: true },
        }),
      ).toBe(false);
    });

    it("turns MCP gating off alone, CLI over env over config", () => {
      expect(resolveMcpAuthenticationEnabled({ globalEnabled: true, config: { mcp: false } })).toBe(false);
      expect(
        resolveMcpAuthenticationEnabled({ globalEnabled: true, env: { MIROIR_MCP_AUTH_ENABLED: "0" }, config: { mcp: true } }),
      ).toBe(false);
      expect(
        resolveMcpAuthenticationEnabled({
          globalEnabled: true,
          argv: ["--disable-mcp-auth", "--enable-mcp-auth"],
          env: { MIROIR_MCP_AUTH_ENABLED: "off" },
        }),
      ).toBe(true);
      expect(resolveMcpAuthenticationEnabled({ globalEnabled: true, argv: ["--disable-mcp-auth"] })).toBe(false);
    });
  });

  describe("gate.263.phase1 RestClientStub gate", () => {
    it("refuses an action without identity with 401", async () => {
      const result = await postQuery(gatedStub(true), LIBRARY_APP, LIBRARY_DEPLOYMENT);
      expect(result).toMatchObject({ status: 401, data: { errorType: "AuthenticationRequired" } });
    });

    it("lets alice reach Library through an action body", async () => {
      const result = await postQuery(gatedStub(true), LIBRARY_APP, LIBRARY_DEPLOYMENT, await bearer("alice"));
      expect(result).toMatchObject({ passedGate: true });
    });

    it("lets dave reach Library through his deployment grant", async () => {
      const result = await postQuery(gatedStub(true), LIBRARY_APP, LIBRARY_DEPLOYMENT, await bearer("dave"));
      expect(result).toMatchObject({ passedGate: true });
    });

    it("refuses carol on Library with 403 AccessDenied, allows her on Admin", async () => {
      const stub = gatedStub(true);
      const carol = await bearer("carol");
      expect(await postQuery(stub, LIBRARY_APP, LIBRARY_DEPLOYMENT, carol)).toMatchObject({
        status: 403,
        data: ACCESS_DENIED,
      });
      expect(await postQuery(stub, ADMIN_APP, ADMIN_DEPLOYMENT, carol)).toMatchObject({ passedGate: true });
    });

    it("checks every deployment the body names, not only payload.deploymentUuid", async () => {
      const result = await gatedStub(true).call("/action", "post", "/action", {
        body: {
          action: {
            actionType: "runBoxedQueryAction",
            payload: { deploymentUuid: ADMIN_DEPLOYMENT, application: LIBRARY_APP, applicationSection: "data", query: {} },
          },
          applicationDeploymentMap: { [LIBRARY_APP]: LIBRARY_DEPLOYMENT },
        },
        headers: { Authorization: await bearer("carol") },
      });
      expect(result).toMatchObject({ status: 403, data: ACCESS_DENIED });
    });

    it("refuses a valid token of an inactive user", async () => {
      const token = await issueBearerToken({ miroirUserUuid: BOB_UUID, username: "bob" }, SECRET);
      const result = await postQuery(gatedStub(true), ADMIN_APP, ADMIN_DEPLOYMENT, `Bearer ${token}`);
      expect(result).toMatchObject({ status: 401 });
    });

    it("needs no identity when the host turned the hatch off", async () => {
      const result = await postQuery(gatedStub(false), LIBRARY_APP, LIBRARY_DEPLOYMENT);
      expect(result).toMatchObject({ passedGate: true });
    });

    it("logs in through /auth/login with the loaded directory", async () => {
      const result = await gatedStub(true).call("/auth/login", "post", "/auth/login", {
        body: { username: "alice", password: "alice-dev" },
      });
      expect(result.status).toBe(200);
      expect((result.data as { token?: string }).token).toBeTruthy();
    });

    it("answers /auth/status with the host's hatch value, without reading the directory", async () => {
      const stub = new RestClientStub("http://test");
      stub.setAuthenticationGate({
        enabled: true,
        secret: SECRET,
        loadDirectory: async () => {
          throw new Error("directory unavailable");
        },
      });
      const result = await stub.call("/auth/status", "get", "/auth/status", {});
      expect(result.data).toEqual({ enabled: true });
      expect(await handleAuthHttpRoute({ url: "/auth/status", enabled: false, env: { MIROIR_AUTH_ENABLED: "1" } })).toEqual({
        status: 200,
        data: { enabled: false },
      });
    });
  });
}
