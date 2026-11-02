/**
 * createMiroirServerApp (#636): Miroir's HTTP surface built from a running server-side domain
 * controller on a test environment, started on port 0 and called over HTTP.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ConfigurationService, getClientEnvironment, getProcessCapabilities } from "@miroir-framework/core";
import { listMcpToolsViaHttp } from "@miroir-framework/mcp";

import { createMiroirServerApp, type MiroirServerApp, type MiroirServerAppOptions } from "../src/index.js";
import {
  BOOK_ENTITY,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  listen,
  startServerTestPlatform,
  type Listening,
  type ServerTestPlatform,
} from "./support/serverTestPlatform.js";

const MODEL_ENDPOINT_UUID = "7947ae40-eb34-4149-887b-15a9021e714e";
const QUERY_ENDPOINT_UUID = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const BIG_DIGITS = "9007199254740993"; // 2^53 + 1: a Number would read 9007199254740992
const BIG_SUM = "9007199254740994";
const INDEX_HTML = "<!doctype html><title>host client</title>";

type Started = { miroir: MiroirServerApp; http: Listening };

let platform: ServerTestPlatform;
let folders: string;
let clientDirectory: string;
let assetsDirectory: string;

type AppSettings = Partial<MiroirServerAppOptions> & { authenticationEnabled?: boolean; mcpEnabled?: boolean; mcp?: boolean };

async function startApp(settings: AppSettings = {}): Promise<Started> {
  const { authenticationEnabled = false, mcpEnabled = false, mcp = true, ...extra } = settings;
  const miroir = await createMiroirServerApp({
    ...platform,
    capabilities: { ...platform.capabilities, mcp },
    authentication: { enabled: authenticationEnabled, mcpEnabled },
    ...extra,
  });
  return { miroir, http: await listen(miroir.app) };
}

async function stop(started: Started): Promise<void> {
  await started.http.close();
  await started.miroir.close();
}

function startedFor(settings: AppSettings): () => Started {
  let started: Started;
  beforeAll(async () => {
    started = await startApp(settings);
  });
  afterAll(async () => {
    await stop(started);
  });
  return () => started;
}

function booksUrl(baseUrl: string): string {
  return `${baseUrl}/CRUD/${LIBRARY_DEPLOYMENT}/data/entity/${BOOK_ENTITY}/all`;
}

function postJson(url: string, body: unknown, token?: string): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

function login(baseUrl: string, username: string, password: string): Promise<Response> {
  return postJson(`${baseUrl}/auth/login`, { username, password });
}

async function aliceToken(baseUrl: string): Promise<string> {
  return (await (await login(baseUrl, "alice", "alice-dev")).json()).token;
}

/** A Query whose runtime transformers carry BigInt values in and out. */
function bigintQuery(runtimeTransformers: Record<string, unknown>) {
  return {
    action: {
      actionType: "runBoxedQueryAction",
      actionLabel: "BigInt over the wire",
      endpoint: QUERY_ENDPOINT_UUID,
      payload: {
        application: LIBRARY_APPLICATION,
        applicationSection: "data",
        queryExecutionStrategy: "localCacheOrFetch",
        query: {
          queryType: "boxedQueryWithExtractorCombinerTransformer",
          application: LIBRARY_APPLICATION,
          pageParams: {},
          queryParams: {},
          contextResults: {},
          extractors: {},
          runtimeTransformers,
        },
      },
    },
    applicationDeploymentMap: platform.applicationDeploymentMap,
  };
}

const bigintValue = (digits: string) => ({ transformerType: "returnValue", interpolation: "runtime", value: { $bigint: digits } });

function toolsListRequest(baseUrl: string): Promise<Response> {
  return fetch(`${baseUrl}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
}

beforeAll(async () => {
  platform = await startServerTestPlatform();
  folders = mkdtempSync(path.join(tmpdir(), "miroir-server-library-"));
  clientDirectory = path.join(folders, "client");
  assetsDirectory = path.join(folders, "public");
  mkdirSync(clientDirectory);
  mkdirSync(assetsDirectory);
  writeFileSync(path.join(clientDirectory, "index.html"), INDEX_HTML);
  writeFileSync(path.join(assetsDirectory, "x.txt"), "an asset");
});

afterAll(() => {
  rmSync(folders, { recursive: true, force: true });
});

describe("createMiroirServerApp — REST, status and capabilities, without authentication", () => {
  const started = startedFor({});

  it("reads the Library's books", async () => {
    const response = await fetch(booksUrl(started().http.baseUrl));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(BOOK_ENTITY);
  });

  it("runs an action", async () => {
    const response = await postJson(`${started().http.baseUrl}/action/rollback`, {
      action: {
        actionType: "rollback",
        actionLabel: "rollback through REST",
        endpoint: MODEL_ENDPOINT_UUID,
        payload: { application: LIBRARY_APPLICATION },
      },
      applicationDeploymentMap: platform.applicationDeploymentMap,
    });
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("ok");
  });

  it("keeps a BigInt whole, in and out", async () => {
    const response = await postJson(
      `${started().http.baseUrl}/query`,
      bigintQuery({
        // only a revived BigInt reaches BigInt addition (the sum comes back as digits)
        sum: { transformerType: "+", interpolation: "runtime", args: [bigintValue(BIG_DIGITS), bigintValue("1")] },
        // a revived BigInt goes back out tagged only through the app's json replacer
        echo: bigintValue(BIG_DIGITS),
      }),
    );
    expect((await response.json()).returnedDomainElement).toEqual({ sum: BIG_SUM, echo: { $bigint: BIG_DIGITS } });
  });

  it("says authentication is off", async () => {
    expect(await (await fetch(`${started().http.baseUrl}/auth/status`)).json()).toEqual({ enabled: false });
  });

  it("answers the process capabilities, recomputed per request, not the capabilities option", async () => {
    // the option says the opposite of the registers: the route must not echo it
    const other = await startApp({ mcp: !platform.capabilities.mcp });
    const response = await fetch(`${other.http.baseUrl}/capabilities`);
    await stop(other);
    const body = await response.json();
    expect(body.capabilities.mcp).toBe(platform.capabilities.mcp);
    expect(body).toEqual({
      status: "ok",
      capabilities: getProcessCapabilities({
        config: platform.miroirConfig,
        environment: getClientEnvironment(),
        storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
        adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
      }),
    });
  });

  it("lists the MCP tools of the deployed endpoints, Library ones included", async () => {
    const tools = await listMcpToolsViaHttp(started().http.baseUrl);
    expect(tools.some((tool) => tool.name.startsWith("Library"))).toBe(true);
  });

  it("serves neither assets, nor a client, nor an assistant route", async () => {
    for (const route of ["/assets/x.txt", "/", "/api/copilotkit/probe"]) {
      expect((await fetch(`${started().http.baseUrl}${route}`)).status).toBe(404);
    }
  });

  it("closes twice without failing", async () => {
    const other = await startApp();
    await stop(other);
    await expect(other.miroir.close()).resolves.toBeUndefined();
  });
});

describe("createMiroirServerApp — with authentication", () => {
  const started = startedFor({
    authenticationEnabled: true,
    mcpEnabled: true,
    assistantRoute: async (app, { requestGate }) => {
      app.get("/api/copilotkit/probe", requestGate, (_request, response) => {
        response.json({ assistant: true });
      });
    },
  });

  it("says authentication is on", async () => {
    expect(await (await fetch(`${started().http.baseUrl}/auth/status`)).json()).toEqual({ enabled: true });
  });

  it("answers REST, /mcp and the assistant route with 401 without a token", async () => {
    const base = started().http.baseUrl;
    expect((await fetch(booksUrl(base))).status).toBe(401);
    expect((await toolsListRequest(base)).status).toBe(401);
    expect((await fetch(`${base}/api/copilotkit/probe`)).status).toBe(401);
  });

  it("logs alice in, and her token opens REST and the assistant route", async () => {
    const base = started().http.baseUrl;
    const token = await aliceToken(base);
    expect((await fetch(booksUrl(base), { headers: { Authorization: `Bearer ${token}` } })).status).toBe(200);
    expect((await fetch(`${base}/api/copilotkit/probe`, { headers: { Authorization: `Bearer ${token}` } })).status).toBe(200);
  });

  it("refuses a wrong password", async () => {
    expect((await login(started().http.baseUrl, "alice", "not-alice-dev")).status).toBe(401);
  });

  // last: alice's password changes
  it("changes alice's password", async () => {
    const base = started().http.baseUrl;
    const changed = await postJson(
      `${base}/auth/change-password`,
      { currentPassword: "alice-dev", newPassword: "alice-dev-changed" },
      await aliceToken(base),
    );
    expect(await changed.json()).toEqual({ changed: true });
    expect((await login(base, "alice", "alice-dev-changed")).status).toBe(200);
    await postJson(
      `${base}/auth/change-password`,
      { currentPassword: "alice-dev-changed", newPassword: "alice-dev" },
      (await (await login(base, "alice", "alice-dev-changed")).json()).token,
    );
  });
});

describe("createMiroirServerApp — authentication on, MCP authentication off (#263 switch)", () => {
  const started = startedFor({ authenticationEnabled: true, mcpEnabled: false });

  it("answers REST with 401 and leaves /mcp open", async () => {
    const base = started().http.baseUrl;
    expect((await fetch(booksUrl(base))).status).toBe(401);
    const tools = await listMcpToolsViaHttp(base);
    expect(tools.length).toBeGreaterThan(0);
  });
});

describe("createMiroirServerApp — MCP capability off", () => {
  const started = startedFor({ mcp: false });

  it("does not mount /mcp on the app, and still returns the MCP server", async () => {
    expect((await toolsListRequest(started().http.baseUrl)).status).toBe(404);
    expect(started().miroir.mcpServer).toBeDefined();
  });
});

describe("createMiroirServerApp — client and assets folders", () => {
  let started: Started;
  let assistantCalls = 0;
  beforeAll(async () => {
    started = await startApp({
      clientDirectory,
      assets: { directory: assetsDirectory, mountPath: "/assets" },
      assistantRoute: async (app, { requestGate, capabilities }) => {
        assistantCalls += 1;
        expect(capabilities.mcp).toBe(true);
        app.get("/api/copilotkit/probe", requestGate, (_request, response) => {
          response.json({ assistant: true });
        });
      },
    });
  });
  afterAll(async () => {
    await stop(started);
  });

  it("calls the assistant route once", () => {
    expect(assistantCalls).toBe(1);
  });

  it("serves the client's index.html at / and on any client route", async () => {
    for (const route of ["/", "/some/client/route"]) {
      const response = await fetch(`${started.http.baseUrl}${route}`);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(INDEX_HTML);
    }
  });

  it("serves the assets folder under its mount path", async () => {
    expect(await (await fetch(`${started.http.baseUrl}/assets/x.txt`)).text()).toBe("an asset");
  });

  it("keeps REST, /auth/status, /mcp and the assistant route ahead of the client catch-all", async () => {
    const base = started.http.baseUrl;
    expect((await fetch(booksUrl(base))).headers.get("content-type")).toContain("application/json");
    expect(await (await fetch(`${base}/auth/status`)).json()).toEqual({ enabled: false });
    expect((await fetch(`${base}/mcp`)).status).toBe(405);
    expect(await (await fetch(`${base}/api/copilotkit/probe`)).json()).toEqual({ assistant: true });
  });

  it("serves nested client routes and assets from relative folders (resolved against the working directory)", async () => {
    const relative = await startApp({
      clientDirectory: path.relative(process.cwd(), clientDirectory),
      assets: { directory: path.relative(process.cwd(), assetsDirectory), mountPath: "/assets" },
    });
    try {
      const response = await fetch(`${relative.http.baseUrl}/some/client/route`);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(INDEX_HTML);
      expect(await (await fetch(`${relative.http.baseUrl}/assets/x.txt`)).text()).toBe("an asset");
    } finally {
      await stop(relative);
    }
  });

  it("rejects a client folder without a build, naming the missing index.html", async () => {
    await expect(startApp({ clientDirectory: assetsDirectory })).rejects.toThrow(
      `React client build not found at ${path.join(assetsDirectory, "index.html")}`,
    );
  });
});

describe("createMiroirServerApp — mounted on a host app", () => {
  let miroir: MiroirServerApp;
  let http: Listening;
  beforeAll(async () => {
    miroir = await createMiroirServerApp({ ...platform, authentication: { enabled: false, mcpEnabled: false } });
    const host = express();
    host.use(miroir.app);
    host.use(express.json());
    host.post("/mine", (request, response) => {
      response.json({ mine: request.body });
    });
    http = await listen(host);
  });
  afterAll(async () => {
    await http.close();
    await miroir.close();
  });

  it("keeps a BigInt whole through the host, mounted before the host's body parser", async () => {
    const response = await postJson(`${http.baseUrl}/query`, bigintQuery({ echo: bigintValue(BIG_DIGITS) }));
    expect((await response.json()).returnedDomainElement).toEqual({ echo: { $bigint: BIG_DIGITS } });
  });

  it("lets the host's own routes answer", async () => {
    expect(await (await postJson(`${http.baseUrl}/mine`, { a: 1 })).json()).toEqual({ mine: { a: 1 } });
  });

  it("states both mount rules in the published types", () => {
    const declarations = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.d.ts"),
      "utf8",
    );
    expect(declarations).toContain("mount `app` at the host's root");
    expect(declarations).toContain("mount it before any host body parser");
  });
});
