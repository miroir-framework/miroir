/**
 * #275 Slice 2 — CopilotKit agents branch + refuse + filtered actions.
 * Do not register in FunctionCallTestRegistry.
 */
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import express, { type Request, type Router } from "express";
import { afterEach, describe, expect, it } from "vitest";
import { AbstractAgent } from "@ag-ui/client";
import { CopilotRuntime } from "@copilotkit/runtime";
import { clearSecrets, isCursorBackendAllowed, registerSecrets, type ProcessCapabilities } from "miroir-core";

import {
  createCopilotKitRouter,
  resolveBackendPick,
} from "../../../../src/routes/copilotKitRoute.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase2";

const CURSOR_ENVELOPE = {
  method: "agent/run",
  body: { forwardedProps: { aiConfig: { backend: "cursor" } } },
};

const TOKEN_ENVELOPE = {
  method: "agent/run",
  body: {},
};

class TestCursorAgent extends AbstractAgent {
  readonly runCalls: unknown[] = [];
  run(input: unknown) {
    this.runCalls.push(input);
    return {
      subscribe() {
        return { unsubscribe() {} };
      },
    } as any;
  }
}

function snapshot(overrides: Partial<ProcessCapabilities> = {}): ProcessCapabilities {
  return {
    ai: true,
    mcp: true,
    cursor: true,
    designerTools: true,
    availableStoreTypes: [],
    creatableStoreTypes: [],
    storeAdministration: false,
    ...overrides,
  };
}

function recordingSeams(testAgent: TestCursorAgent) {
  const runtimeOptions: any[] = [];
  const endpointOptions: any[] = [];
  const tokenBuilds: any[] = [];
  return {
    runtimeOptions,
    endpointOptions,
    tokenBuilds,
    createCursorAbstractAgent: () => testAgent,
    createCopilotRuntime: (options: any) => {
      runtimeOptions.push(options);
      return { dummyCursorRuntime: true };
    },
    buildCopilotRuntime: (config: any, actions: any) => {
      tokenBuilds.push({ config, actions });
      return {
        runtime: { dummyTokenRuntime: true },
        serviceAdapter: { name: "recorded-token-adapter" },
      };
    },
    copilotRuntimeNodeHttpEndpoint: (options: any) => {
      endpointOptions.push(options);
      return async (_req: any, res: any) => {
        res.status(200).json({ ok: true });
      };
    },
  };
}

async function postJson(router: Router, body: unknown): Promise<{ status: number; body: any }> {
  const app = express();
  app.use(express.json());
  app.use(router);
  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  try {
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

if (runThis) {
  describe("cursorSdk.275.phase2 — resolveBackendPick", () => {
    it("reads forwardedProps.aiConfig.backend from the 1.59 envelope", () => {
      const req = {
        body: CURSOR_ENVELOPE,
      } as Request;
      expect(resolveBackendPick(req)).toBe("cursor");
    });

    it("falls back to top-level body.aiConfig.backend", () => {
      const req = {
        body: { aiConfig: { backend: "cursor" } },
      } as Request;
      expect(resolveBackendPick(req)).toBe("cursor");
    });

    it("returns undefined when neither location picks cursor", () => {
      const req = {
        body: TOKEN_ENVELOPE,
      } as Request;
      expect(resolveBackendPick(req)).toBeUndefined();
    });
  });

  describe("cursorSdk.275.phase2 — isCursorBackendAllowed", () => {
    it("is true only when ai, cursor, and mcp are all true", () => {
      expect(isCursorBackendAllowed(snapshot())).toBe(true);
      expect(isCursorBackendAllowed(snapshot({ ai: false }))).toBe(false);
      expect(isCursorBackendAllowed(snapshot({ cursor: false }))).toBe(false);
      expect(isCursorBackendAllowed(snapshot({ mcp: false }))).toBe(false);
    });
  });

  describe("cursorSdk.275.phase2 — CopilotRuntime construction gate", () => {
    it("constructs CopilotRuntime with agents and a non-empty actions array", () => {
      const agent = new TestCursorAgent();
      expect(() =>
        new CopilotRuntime({
          agents: { default: agent, cursor: agent },
          actions: [
            {
              name: "lendDocument",
              description: "lend",
              parameters: [],
              handler: async () => ({ ok: true }),
            },
          ],
        }),
      ).not.toThrow();
    });
  });

  describe("cursorSdk.275.phase2 — cursor agents branch", () => {
    it("builds CopilotRuntime with injected agent, filtered actions, and no serviceAdapter", async () => {
      const testAgent = new TestCursorAgent();
      const seams = recordingSeams(testAgent);
      const router = createCopilotKitRouter(undefined as any, {}, {
        capabilities: snapshot(),
        createCursorAbstractAgent: seams.createCursorAbstractAgent,
        createCopilotRuntime: seams.createCopilotRuntime,
        buildCopilotRuntime: seams.buildCopilotRuntime,
        copilotRuntimeNodeHttpEndpoint: seams.copilotRuntimeNodeHttpEndpoint,
      });

      const result = await postJson(router, CURSOR_ENVELOPE);

      expect(result.status).toBe(200);
      expect(seams.tokenBuilds).toHaveLength(0);
      expect(seams.runtimeOptions).toHaveLength(1);
      expect(seams.runtimeOptions[0].agents.default).toBe(testAgent);
      expect(seams.runtimeOptions[0].agents.cursor).toBe(testAgent);
      expect(Array.isArray(seams.runtimeOptions[0].actions)).toBe(true);
      expect(seams.runtimeOptions[0].actions.length).toBeGreaterThan(0);
      const actionNames = seams.runtimeOptions[0].actions.map((action: { name: string }) => action.name);
      expect(actionNames).not.toContain("generateMiroirReport");
      expect(actionNames).not.toContain("getMiroirContext");
      expect(seams.endpointOptions).toHaveLength(1);
      expect(seams.endpointOptions[0]).not.toHaveProperty("serviceAdapter");
    });
  });

  describe("cursorSdk.275.phase2 — refuse uses injected snapshot", () => {
    it("returns FeatureUnavailable capability cursor when injected snapshot has cursor false", async () => {
      const testAgent = new TestCursorAgent();
      const seams = recordingSeams(testAgent);
      const router = createCopilotKitRouter(undefined as any, {}, {
        capabilities: snapshot({ cursor: false }),
        createCursorAbstractAgent: seams.createCursorAbstractAgent,
        createCopilotRuntime: seams.createCopilotRuntime,
        buildCopilotRuntime: seams.buildCopilotRuntime,
        copilotRuntimeNodeHttpEndpoint: seams.copilotRuntimeNodeHttpEndpoint,
      });

      const result = await postJson(router, CURSOR_ENVELOPE);

      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.body).toMatchObject({
        status: "error",
        errorType: "FeatureUnavailable",
        errorContext: { capability: "cursor" },
      });
      expect(seams.runtimeOptions).toHaveLength(0);
      expect(seams.tokenBuilds).toHaveLength(0);
      expect(seams.endpointOptions).toHaveLength(0);
    });

    it("returns FeatureUnavailable capability mcp from getCapabilities when mcp is false", async () => {
      const testAgent = new TestCursorAgent();
      const seams = recordingSeams(testAgent);
      let snapshotReads = 0;
      const router = createCopilotKitRouter(undefined as any, {}, {
        getCapabilities: () => {
          snapshotReads += 1;
          return snapshot({ mcp: false });
        },
        createCursorAbstractAgent: seams.createCursorAbstractAgent,
        createCopilotRuntime: seams.createCopilotRuntime,
        buildCopilotRuntime: seams.buildCopilotRuntime,
        copilotRuntimeNodeHttpEndpoint: seams.copilotRuntimeNodeHttpEndpoint,
      });

      const result = await postJson(router, CURSOR_ENVELOPE);

      expect(snapshotReads).toBeGreaterThan(0);
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.body).toMatchObject({
        status: "error",
        errorType: "FeatureUnavailable",
        errorContext: { capability: "mcp" },
      });
      expect(seams.runtimeOptions).toHaveLength(0);
    });
  });

  describe("cursorSdk.275.phase2 — token path still uses buildCopilotRuntime", () => {
    afterEach(() => {
      clearSecrets();
    });

    it("records the token adapter path when there is no backend pick", async () => {
      registerSecrets({
        aiOpenaiKey: "sk-test-openai",
        aiAnthropicKey: "sk-ant-test",
        aiGoogleKey: "aig-test",
        aiGithubToken: "gh-test-token",
      });
      process.env.AI_PROVIDER_TYPE = "openai";
      process.env.AI_MODEL = "gpt-4o";

      const testAgent = new TestCursorAgent();
      const seams = recordingSeams(testAgent);
      const router = createCopilotKitRouter(undefined as any, {}, {
        capabilities: snapshot(),
        createCursorAbstractAgent: seams.createCursorAbstractAgent,
        createCopilotRuntime: seams.createCopilotRuntime,
        buildCopilotRuntime: seams.buildCopilotRuntime,
        copilotRuntimeNodeHttpEndpoint: seams.copilotRuntimeNodeHttpEndpoint,
      });

      const result = await postJson(router, TOKEN_ENVELOPE);

      expect(result.status).toBe(200);
      expect(seams.runtimeOptions).toHaveLength(0);
      expect(seams.tokenBuilds).toHaveLength(1);
      expect(seams.tokenBuilds[0].config).toMatchObject({ providerType: "openai", model: "gpt-4o" });
      expect(seams.endpointOptions).toHaveLength(1);
      expect(seams.endpointOptions[0]).toHaveProperty("serviceAdapter");
      expect(seams.endpointOptions[0].serviceAdapter).toMatchObject({ name: "recorded-token-adapter" });

      delete process.env.AI_PROVIDER_TYPE;
      delete process.env.AI_MODEL;
    });
  });

  describe("cursorSdk.275.phase2 — info advertises default agent", () => {
    it("POST method info JSON includes agents.default so CopilotKit shares one chat agent", async () => {
      const router = createCopilotKitRouter(undefined as any, {}, {
        capabilities: snapshot(),
      });

      const result = await postJson(router, { method: "info" });

      expect(result.status).toBe(200);
      expect(result.body?.agents?.default).toEqual(
        expect.objectContaining({ name: "default" }),
      );
    });
  });
}
