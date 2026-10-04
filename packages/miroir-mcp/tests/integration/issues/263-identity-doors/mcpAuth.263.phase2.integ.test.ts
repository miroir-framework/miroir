/**
 * #263 Slice 2: the MCP HTTP route asks for a platform user when its gate is on (401 without a
 * Bearer), then applies the application access rule per tool call (AccessDenied tool error).
 * In-process server on test-filesystem, like mcpTools.integ. Admin seed users: alice (Library
 * grant), carol (no grant).
 */
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  accessDirectoryLoader,
  issueBearerToken,
  type AuthenticationGate,
  type LoggerOptions,
} from "miroir-core";

import { MCP_HTTP_ENDPOINT, setupMcpServer } from "../../../../src/mcpServer.js";
import { EndpointToolRegistry } from "../../../../src/tools/EndpointToolRegistry.js";
import { startMcpTestPlatform, type McpTestPlatform } from "../../mcpTestPlatform.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("mcpAuth.263");

const SECRET = "mcp-secret-263";
const ALICE = { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" };
const CAROL = { miroirUserUuid: "30634877-08ae-44f3-a230-d899e22333d5", username: "carol" };
const LIBRARY_APP = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const ADMIN_APP = "55af124e-8c05-4bae-a3ef-0933d41daa92";
const ENTITY_BOOK = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5";
const ENTITY_MIROIR_USER = "d20d09e5-0685-4fc7-b9bd-fcfa3845127a";
const globalTimeOut = 60000;

const loggerOptions: LoggerOptions = {
  defaultLevel: "WARN",
  defaultTemplate: "[{{time}}] {{level}} ({{name}}) -",
  specificLoggerOptions: {},
};

let platform: McpTestPlatform;
const servers: Server[] = [];

async function startServer(enabled: boolean): Promise<string> {
  const gate: AuthenticationGate = {
    enabled,
    loadDirectory: accessDirectoryLoader(platform.domainController, platform.applicationDeploymentMap),
    secret: SECRET,
  };
  const app = express();
  const registry = new EndpointToolRegistry(platform.domainController, platform.applicationDeploymentMap);
  await setupMcpServer(app, platform.applicationDeploymentMap, registry, platform.domainController, gate);
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
  });
  servers.push(server);
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}${MCP_HTTP_ENDPOINT}`;
}

async function getInstances(url: string, application: string, parentUuid: string, authorization?: string) {
  const client = new Client({ name: "mcp-auth-263", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: authorization ? { headers: { Authorization: authorization } } : undefined,
  });
  await client.connect(transport);
  try {
    const result = (await client.callTool({
      name: "Miroir_getInstances",
      arguments: { application, applicationSection: "data", parentUuid },
    })) as { content: Array<{ type: string; text: string }> };
    const text = result.content.map((entry) => entry.text).join("\n");
    return { status: (JSON.parse(text) as { status?: string }).status, text };
  } finally {
    await transport.close();
  }
}

async function bearer(principal: typeof ALICE) {
  return `Bearer ${await issueBearerToken(principal, SECRET)}`;
}

if (runThis) {
  describe("mcpAuth.263.phase2 MCP identity and access", () => {
    beforeAll(async () => {
      platform = await startMcpTestPlatform(expect, loggerOptions);
    }, globalTimeOut);

    afterAll(async () => {
      await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
    });

    it("answers 401 without a Bearer", async () => {
      const url = await startServer(true);
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
      });
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ errorType: "AuthenticationRequired" });
    }, globalTimeOut);

    it("answers 401 for a token signed with another secret", async () => {
      const url = await startServer(true);
      const foreign = `Bearer ${await issueBearerToken(ALICE, "another-secret")}`;
      await expect(getInstances(url, LIBRARY_APP, ENTITY_BOOK, foreign)).rejects.toThrow(/AuthenticationRequired/);
    }, globalTimeOut);

    it("runs alice's Library read", async () => {
      const url = await startServer(true);
      const result = await getInstances(url, LIBRARY_APP, ENTITY_BOOK, await bearer(ALICE));
      expect(result.status).toBe("success");
    }, globalTimeOut);

    it("denies carol the Library read, allows her Admin read", async () => {
      const url = await startServer(true);
      const carol = await bearer(CAROL);
      const denied = await getInstances(url, LIBRARY_APP, ENTITY_BOOK, carol);
      expect(denied.status).toBe("error");
      expect(denied.text).toContain("AccessDenied");
      const admin = await getInstances(url, ADMIN_APP, ENTITY_MIROIR_USER, carol);
      expect(admin.status).toBe("success");
    }, globalTimeOut);

    it("needs no identity when the MCP gate is off", async () => {
      const url = await startServer(false);
      expect((await getInstances(url, LIBRARY_APP, ENTITY_BOOK)).status).toBe("success");
    }, globalTimeOut);
  });
}
