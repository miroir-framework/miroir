/**
 * #636 Slice 4 — the tail of the route order: static assets and the client folder are options, the
 * host's assistant route gets Miroir's identity gate, and every API route, `/mcp` and the assistant
 * route win over the client catch-all.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createMiroirServerApp, type MiroirServerApp, type MiroirServerAppOptions } from "../../../src/index.js";
import {
  BOOK_ENTITY,
  LIBRARY_DEPLOYMENT,
  listen,
  startServerTestPlatform,
  type Listening,
  type ServerTestPlatform,
} from "../../support/serverTestPlatform.js";

const INDEX_HTML = "<!doctype html><title>host client #636</title>";

let platform: ServerTestPlatform;
let folders: string;
let clientDirectory: string;
let assetsDirectory: string;

type Started = { miroir: MiroirServerApp; http: Listening };

async function startApp(extra: Partial<MiroirServerAppOptions>, authenticationEnabled = false): Promise<Started> {
  const miroir = await createMiroirServerApp({
    ...platform,
    capabilities: { ...platform.capabilities, mcp: true },
    authentication: { enabled: authenticationEnabled, mcpEnabled: false },
    ...extra,
  });
  return { miroir, http: await listen(miroir.app) };
}

async function stop(started: Started): Promise<void> {
  await started.http.close();
  await started.miroir.close();
}

beforeAll(async () => {
  platform = await startServerTestPlatform();
  folders = mkdtempSync(path.join(tmpdir(), "miroir-server-library-636-"));
  clientDirectory = path.join(folders, "client");
  assetsDirectory = path.join(folders, "public");
  mkdirSync(clientDirectory);
  mkdirSync(assetsDirectory);
  writeFileSync(path.join(clientDirectory, "index.html"), INDEX_HTML);
  writeFileSync(path.join(assetsDirectory, "x.txt"), "asset #636");
});

afterAll(() => {
  rmSync(folders, { recursive: true, force: true });
});

describe("serverApp.636.phase4 — client and assets folders", () => {
  let started: Started;
  beforeAll(async () => {
    started = await startApp({
      clientDirectory,
      assets: { directory: assetsDirectory, mountPath: "/assets" },
      assistantRoute: async (app, { requestGate }) => {
        app.get("/api/copilotkit/probe", requestGate, (_request, response) => {
          response.json({ assistant: true });
        });
      },
    });
  });
  afterAll(async () => {
    await stop(started);
  });

  it("serves the client's index.html at / and on any client route", async () => {
    for (const route of ["/", "/some/client/route"]) {
      const response = await fetch(`${started.http.baseUrl}${route}`);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(INDEX_HTML);
    }
  });

  it("serves the assets folder under its mount path", async () => {
    const response = await fetch(`${started.http.baseUrl}/assets/x.txt`);
    expect(await response.text()).toBe("asset #636");
  });

  it("keeps REST, /auth/status, /mcp and the assistant route ahead of the client catch-all", async () => {
    const base = started.http.baseUrl;
    const books = await fetch(`${base}/CRUD/${LIBRARY_DEPLOYMENT}/data/entity/${BOOK_ENTITY}/all`);
    expect(books.headers.get("content-type")).toContain("application/json");
    expect(await (await fetch(`${base}/auth/status`)).json()).toEqual({ enabled: false });
    expect((await fetch(`${base}/mcp`)).status).toBe(405);
    expect(await (await fetch(`${base}/api/copilotkit/probe`)).json()).toEqual({ assistant: true });
  });
});

describe("serverApp.636.phase4 — no folders, no assistant", () => {
  let started: Started;
  beforeAll(async () => {
    started = await startApp({});
  });
  afterAll(async () => {
    await stop(started);
  });

  it("serves neither assets, nor a client, nor an assistant route", async () => {
    for (const route of ["/assets/x.txt", "/", "/api/copilotkit/probe"]) {
      expect((await fetch(`${started.http.baseUrl}${route}`)).status).toBe(404);
    }
  });
});

describe("serverApp.636.phase4 — client folder without a build", () => {
  it("rejects, naming the missing index.html", async () => {
    await expect(startApp({ clientDirectory: assetsDirectory })).rejects.toThrow(
      `React client build not found at ${path.join(assetsDirectory, "index.html")}`,
    );
  });
});

describe("serverApp.636.phase4 — the assistant route behind the identity gate", () => {
  let started: Started;
  let calls = 0;
  beforeAll(async () => {
    started = await startApp(
      {
        assistantRoute: async (app, { requestGate, capabilities }) => {
          calls += 1;
          expect(capabilities.mcp).toBe(true);
          app.get("/api/copilotkit/probe", requestGate, (_request, response) => {
            response.json({ assistant: true });
          });
        },
      },
      true,
    );
  });
  afterAll(async () => {
    await stop(started);
  });

  it("is registered once", () => {
    expect(calls).toBe(1);
  });

  it("answers 401 without a token and 200 with alice's", async () => {
    const base = started.http.baseUrl;
    expect((await fetch(`${base}/api/copilotkit/probe`)).status).toBe(401);
    const { token } = await (
      await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "alice", password: "alice-dev" }),
      })
    ).json();
    const response = await fetch(`${base}/api/copilotkit/probe`, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status).toBe(200);
  });
});
