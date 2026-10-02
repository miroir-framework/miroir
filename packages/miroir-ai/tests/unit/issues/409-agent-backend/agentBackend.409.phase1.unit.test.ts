/**
 * #409 Slice 1: the CopilotKit route sends an agent request ("agent", or the "cursor" alias) to
 * the configured backend, and refuses it with capability "agent" when the backend is none.
 * Do not register in FunctionCallTestRegistry.
 */
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import express, { type Router } from "express";
import { describe, expect, it } from "vitest";
import { AbstractAgent } from "@ag-ui/client";
import { FAIL_CLOSED_PROCESS_CAPABILITIES, type ProcessCapabilities } from "miroir-core";

import { createCopilotKitRouter } from "../../../../src/routes/copilotKitRoute.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("agentBackend.409");

class StubAgent extends AbstractAgent {
  override run(): any {
    throw new Error("not run in this test");
  }
}

function snapshot(overrides: Partial<ProcessCapabilities>): ProcessCapabilities {
  return { ...FAIL_CLOSED_PROCESS_CAPABILITIES, ai: true, mcp: true, ...overrides };
}

function agentRequest(backend: string) {
  return { method: "agent/run", body: { forwardedProps: { aiConfig: { backend } } } };
}

async function postJson(router: Router, body: unknown): Promise<{ status: number; body: any }> {
  const app = express();
  app.use(express.json());
  app.use(router);
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  try {
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

function routerFor(capabilities: ProcessCapabilities, agentFactoryCalls: string[]) {
  return createCopilotKitRouter({} as any, {}, {
    capabilities,
    createAgentForBackend: (backend) => {
      agentFactoryCalls.push(backend);
      return new StubAgent();
    },
    createCopilotRuntime: () => ({ recorded: true }),
    copilotRuntimeNodeHttpEndpoint: () => async (_req: any, res: any) => {
      res.status(200).json({ ok: true });
    },
  });
}

if (runThis) {
  describe("agentBackend.409.phase1: agent requests follow agentBackend", () => {
    it("sends an 'agent' request to the configured cursor backend", async () => {
      const calls: string[] = [];
      const response = await postJson(routerFor(snapshot({ agentBackend: "cursor" }), calls), agentRequest("agent"));
      expect(response.status).toBe(200);
      expect(calls).toEqual(["cursor"]);
    });

    it("accepts 'cursor' as an alias of 'agent'", async () => {
      const calls: string[] = [];
      const response = await postJson(routerFor(snapshot({ agentBackend: "cursor" }), calls), agentRequest("cursor"));
      expect(response.status).toBe(200);
      expect(calls).toEqual(["cursor"]);
    });

    it("refuses an agent request with capability 'agent' when the backend is none", async () => {
      const calls: string[] = [];
      const response = await postJson(routerFor(snapshot({ agentBackend: "none" }), calls), agentRequest("agent"));
      expect(response.status).toBe(403);
      expect(response.body.errorType).toBe("FeatureUnavailable");
      expect(response.body.errorContext?.capability).toBe("agent");
      expect(calls).toEqual([]);
    });
  });
}
