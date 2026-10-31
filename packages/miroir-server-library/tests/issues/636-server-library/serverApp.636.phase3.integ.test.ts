/**
 * #636 Slice 3 — MCP from createMiroirServerApp: `/mcp` on the app when the mcp capability is on,
 * behind the MCP switch of the authentication gate.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listMcpToolsViaHttp } from "miroir-mcp";

import { createMiroirServerApp, type MiroirServerApp } from "../../../src/index.js";
import { listen, startServerTestPlatform, type Listening, type ServerTestPlatform } from "../../support/serverTestPlatform.js";

let platform: ServerTestPlatform;

async function startApp(args: { mcp: boolean; mcpEnabled: boolean }): Promise<{ miroir: MiroirServerApp; http: Listening }> {
  const miroir = await createMiroirServerApp({
    ...platform,
    capabilities: { ...platform.capabilities, mcp: args.mcp },
    authentication: { enabled: args.mcpEnabled, mcpEnabled: args.mcpEnabled },
  });
  return { miroir, http: await listen(miroir.app) };
}

function toolsListRequest(baseUrl: string): Promise<Response> {
  return fetch(`${baseUrl}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
}

beforeAll(async () => {
  platform = await startServerTestPlatform();
});

describe("serverApp.636.phase3 — MCP capability on, MCP authentication off", () => {
  let started: { miroir: MiroirServerApp; http: Listening };
  beforeAll(async () => {
    started = await startApp({ mcp: true, mcpEnabled: false });
  });
  afterAll(async () => {
    await started.http.close();
    await started.miroir.close();
  });

  it("lists the tools of the deployed endpoints, Library ones included", async () => {
    const tools = await listMcpToolsViaHttp(started.http.baseUrl);
    expect(tools.some((tool) => tool.name.startsWith("Library"))).toBe(true);
  });

  it("closes twice without failing", async () => {
    const other = await startApp({ mcp: true, mcpEnabled: false });
    await other.http.close();
    await other.miroir.close();
    await expect(other.miroir.close()).resolves.toBeUndefined();
  });
});

describe("serverApp.636.phase3 — MCP authentication on", () => {
  let started: { miroir: MiroirServerApp; http: Listening };
  beforeAll(async () => {
    started = await startApp({ mcp: true, mcpEnabled: true });
  });
  afterAll(async () => {
    await started.http.close();
    await started.miroir.close();
  });

  it("answers 401 without a token", async () => {
    expect((await toolsListRequest(started.http.baseUrl)).status).toBe(401);
  });
});

describe("serverApp.636.phase3 — MCP capability off", () => {
  let started: { miroir: MiroirServerApp; http: Listening };
  beforeAll(async () => {
    started = await startApp({ mcp: false, mcpEnabled: false });
  });
  afterAll(async () => {
    await started.http.close();
    await started.miroir.close();
  });

  it("does not mount /mcp on the app, and still returns the MCP server", async () => {
    expect((await toolsListRequest(started.http.baseUrl)).status).toBe(404);
    expect(started.miroir.mcpServer).toBeDefined();
  });
});
