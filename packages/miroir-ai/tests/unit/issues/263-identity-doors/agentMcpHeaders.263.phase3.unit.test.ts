/**
 * #263 Slice 3 — the in-app agent calls the gated Miroir MCP server with the CopilotKit caller's
 * Authorization, so its tool calls run as that user. SDKs are the offline recording stand-ins the
 * #409 tests inject through the importer seams.
 * Do not register in FunctionCallTestRegistry.
 */
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import express, { type Router } from "express";
import { afterEach, describe, expect, it } from "vitest";
import { AbstractAgent } from "@ag-ui/client";
import { clearSecrets, FAIL_CLOSED_PROCESS_CAPABILITIES, registerSecrets } from "miroir-core";

import { createCopilotKitRouter, type AgentRunRequest } from "../../../../src/routes/copilotKitRoute.js";
import { createClaudeAbstractAgent } from "../../../../src/runtime/claudeAgent.js";
import { createCursorAbstractAgent } from "../../../../src/runtime/cursorAgent.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("agentMcpHeaders.263");

const MCP_URL = "http://127.0.0.1:4173/mcp";
const AUTHORIZATION = "Bearer token-263";

function recordingClaudeSdk() {
  const options: Array<Record<string, any>> = [];
  const importSdk = async () => ({
    query: (params: { prompt: unknown; options: Record<string, any> }) => {
      options.push(params.options);
      return (async function* () {})();
    },
  });
  return { importSdk, options };
}

function recordingCursorSdk() {
  const options: Array<Record<string, any>> = [];
  const importSdk = async () => ({
    Agent: {
      create: async (created: Record<string, any>) => {
        options.push(created);
        return { [Symbol.asyncDispose]: async () => {} } as any;
      },
    },
  });
  return { importSdk, options };
}

class StubAgent extends AbstractAgent {
  override run(): any {
    throw new Error("not run in this test");
  }
}

async function postAgentRequest(router: Router, headers: Record<string, string>): Promise<number> {
  const app = express();
  app.use(express.json());
  app.use(router);
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  try {
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ method: "agent/run", body: { forwardedProps: { aiConfig: { backend: "agent" } } } }),
    });
    return response.status;
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

if (runThis) {
  describe("agentMcpHeaders.263.phase3 agents send the caller's Authorization to MCP", () => {
    afterEach(() => {
      clearSecrets();
    });

    it("the Claude agent puts the headers on its Miroir MCP server", async () => {
      registerSecrets({ aiAnthropicKey: "anthropic-probe-key" });
      const sdk = recordingClaudeSdk();
      const agent = await createClaudeAbstractAgent({
        importSdk: sdk.importSdk,
        mcpHttpUrl: MCP_URL,
        mcpHeaders: { Authorization: AUTHORIZATION },
      });
      await new Promise<void>((resolve) => {
        agent
          .run({ threadId: "t", runId: "r", messages: [{ id: "m", role: "user", content: "hi" }], tools: [], context: [], state: {}, forwardedProps: {} } as any)
          .subscribe({ complete: () => resolve(), error: () => resolve() });
      });
      expect(sdk.options[0]?.mcpServers?.miroir).toEqual({
        type: "http",
        url: MCP_URL,
        headers: { Authorization: AUTHORIZATION },
      });
    });

    it("the Cursor agent puts the headers on its Miroir MCP server", async () => {
      registerSecrets({ aiCursorKey: "cursor-probe-key" });
      const sdk = recordingCursorSdk();
      await createCursorAbstractAgent({
        importSdk: sdk.importSdk as any,
        mcpHttpUrl: MCP_URL,
        mcpHeaders: { Authorization: AUTHORIZATION },
        nodeVersion: "22.99.0",
      });
      expect(sdk.options[0]?.mcpServers?.miroir).toEqual({
        type: "http",
        url: MCP_URL,
        headers: { Authorization: AUTHORIZATION },
      });
    });

    it("keeps today's MCP config when there is no caller identity", async () => {
      registerSecrets({ aiCursorKey: "cursor-probe-key" });
      const sdk = recordingCursorSdk();
      await createCursorAbstractAgent({ importSdk: sdk.importSdk as any, mcpHttpUrl: MCP_URL, nodeVersion: "22.99.0" });
      expect(sdk.options[0]?.mcpServers?.miroir).toEqual({ type: "http", url: MCP_URL });
    });

    it("the CopilotKit router creates the agent with the request's Authorization", async () => {
      const runs: AgentRunRequest[] = [];
      const router = createCopilotKitRouter({} as any, {}, {
        capabilities: { ...FAIL_CLOSED_PROCESS_CAPABILITIES, ai: true, mcp: true, agentBackend: "claude" },
        createAgentForBackend: (_backend, run) => {
          runs.push(run);
          return new StubAgent();
        },
        createCopilotRuntime: () => ({ recorded: true }),
        copilotRuntimeNodeHttpEndpoint: () => async (_req: any, res: any) => {
          res.status(200).json({ ok: true });
        },
      });
      expect(await postAgentRequest(router, { authorization: AUTHORIZATION })).toBe(200);
      expect(await postAgentRequest(router, {})).toBe(200);
      expect(runs).toEqual([{ mcpHeaders: { Authorization: AUTHORIZATION } }, {}]);
    });
  });
}
