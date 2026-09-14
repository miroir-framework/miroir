/**
 * #275 Slice 4 — lazy Cursor SDK factory, dummy cwd, loopback MCP, Node floor.
 * Do not register in FunctionCallTestRegistry.
 */
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import type { AddressInfo } from "node:net";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Router } from "express";
import { afterEach, describe, expect, it } from "vitest";
import { AbstractAgent } from "@ag-ui/client";
import { EventType, type RunAgentInput } from "@ag-ui/core";
import { clearSecrets, registerSecrets, type ProcessCapabilities } from "miroir-core";

import { createCopilotKitRouter } from "../../../../src/routes/copilotKitRoute.js";
import {
  createCursorAbstractAgent,
  isNodeVersionAtLeast,
} from "../../../../src/runtime/cursorAgent.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase4";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const TEST_CURSOR_KEY = "cursor-test-key-slice4";
const TEST_API_PORT = 4173;
const TEST_MCP_HTTP_URL = `http://127.0.0.1:${TEST_API_PORT}/mcp`;

const CURSOR_ENVELOPE = {
  method: "agent/run",
  body: { forwardedProps: { aiConfig: { backend: "cursor" } } },
};

const TOKEN_ENVELOPE = {
  method: "agent/run",
  body: {},
};

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

function readPackageJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readRepoFile(relativePath)) as Record<string, unknown>;
}

function packageHasCursorSdkDependency(pkgJson: Record<string, unknown>): boolean {
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  for (const section of sections) {
    const deps = pkgJson[section] as Record<string, string> | undefined;
    if (deps?.["@cursor/sdk"]) {
      return true;
    }
  }
  return false;
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

function recordingSeams() {
  const runtimeOptions: any[] = [];
  const endpointOptions: any[] = [];
  const tokenBuilds: any[] = [];
  return {
    runtimeOptions,
    endpointOptions,
    tokenBuilds,
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

function mcpServerEntries(createOptions: Record<string, any>): any[] {
  const servers =
    createOptions.mcpServers ??
    createOptions.mcp_servers ??
    createOptions.local?.mcpServers ??
    {};
  if (Array.isArray(servers)) {
    return servers;
  }
  return Object.values(servers);
}

function recordedTools(createOptions: Record<string, any>): unknown {
  return createOptions.tools ?? createOptions.local?.tools;
}

function createRecordingImportSdk(
  createCalls: Record<string, any>[],
  options: { sendPrompts?: string[]; streamEvents?: unknown[] } = {},
) {
  let importCount = 0;
  const importSdk = async () => {
    importCount += 1;
    return {
      Agent: {
        create: async (createOptions: Record<string, any>) => {
          createCalls.push(createOptions);
          return {
            send: async (prompt: string) => {
              options.sendPrompts?.push(prompt);
              return {
                stream: async function* () {
                  if (options.streamEvents) {
                    yield* options.streamEvents;
                    return;
                  }
                  yield {
                    type: "assistant",
                    message: { content: [{ type: "text", text: "hello from stub" }] },
                  };
                },
                wait: async () => ({ status: "finished" }),
              };
            },
            async [Symbol.asyncDispose]() {
              return undefined;
            },
          };
        },
      },
    };
  };
  return {
    importSdk,
    getImportCount: () => importCount,
  };
}

if (runThis) {
  describe("cursorSdk.275.phase4 — isNodeVersionAtLeast", () => {
    it("is false for 20.0.0 and true for 22.13.0 and 24.13.1", () => {
      expect(isNodeVersionAtLeast(22, 13, 0, "20.0.0")).toBe(false);
      expect(isNodeVersionAtLeast(22, 13, 0, "22.13.0")).toBe(true);
      expect(isNodeVersionAtLeast(22, 13, 0, "24.13.1")).toBe(true);
    });
  });

  describe("cursorSdk.275.phase4 — lazy importSdk and Agent.create options", () => {
    afterEach(() => {
      clearSecrets();
    });

    it("calls importSdk once on first use and passes locked Agent.create options", async () => {
      registerSecrets({ aiCursorKey: TEST_CURSOR_KEY });
      const createCalls: Record<string, any>[] = [];
      const { importSdk, getImportCount } = createRecordingImportSdk(createCalls);

      const first = await createCursorAbstractAgent({
        importSdk,
        apiPort: TEST_API_PORT,
        nodeVersion: "22.13.0",
      });
      const second = await createCursorAbstractAgent({
        importSdk,
        mcpHttpUrl: TEST_MCP_HTTP_URL,
        nodeVersion: "22.13.0",
      });

      expect(getImportCount()).toBe(1);
      expect(createCalls).toHaveLength(2);
      expect(first).toBeInstanceOf(AbstractAgent);
      expect(typeof (first as AbstractAgent).run).toBe("function");
      expect(second).toBeInstanceOf(AbstractAgent);

      const options = createCalls[0];
      expect(options.apiKey).toBe(TEST_CURSOR_KEY);
      expect(options.local?.cwd).toBeTruthy();
      expect(basename(options.local.cwd)).toBe(".miroir-cursor-cwd");
      expect(existsSync(options.local.cwd)).toBe(true);
      expect(options.local.cwd).not.toBe(process.cwd());
      expect(recordedTools(options)).toEqual(["mcp"]);

      const mcpEntries = mcpServerEntries(options);
      expect(mcpEntries.length).toBeGreaterThan(0);
      expect(mcpEntries.some((entry) => entry?.url === TEST_MCP_HTTP_URL)).toBe(true);
      for (const entry of mcpEntries) {
        const headers = entry?.headers ?? {};
        expect(headers.Authorization).toBeUndefined();
        expect(headers.authorization).toBeUndefined();
        expect(JSON.stringify(entry)).not.toMatch(/Authorization/i);
      }

      await (first as any)[Symbol.asyncDispose]?.();
      await (second as any)[Symbol.asyncDispose]?.();
    });

    it("clone().run() is an Observable with pipe and emits stub assistant text", async () => {
      registerSecrets({ aiCursorKey: TEST_CURSOR_KEY });
      const createCalls: Record<string, any>[] = [];
      const { importSdk } = createRecordingImportSdk(createCalls);
      const agent = await createCursorAbstractAgent({
        importSdk,
        mcpHttpUrl: TEST_MCP_HTTP_URL,
        nodeVersion: "22.13.0",
      });

      const cloned = agent.clone();
      const events$ = cloned.run({
        threadId: "thread-1",
        runId: "run-1",
        messages: [{ id: "m1", role: "user", content: "hello" }],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      } as RunAgentInput);

      expect(typeof (events$ as { pipe?: unknown }).pipe).toBe("function");

      const events: { type?: string; delta?: string }[] = [];
      await new Promise<void>((resolve, reject) => {
        events$.subscribe({
          next: (event) => events.push(event as { type?: string; delta?: string }),
          error: reject,
          complete: resolve,
        });
      });

      expect(events.some((event) => event.type === EventType.RUN_STARTED)).toBe(true);
      expect(
        events.some(
          (event) =>
            event.type === EventType.TEXT_MESSAGE_CONTENT &&
            String(event.delta).includes("hello from stub"),
        ),
      ).toBe(true);
      expect(events.some((event) => event.type === EventType.RUN_FINISHED)).toBe(true);

      await (agent as any)[Symbol.asyncDispose]?.();
    });

    it("send() receives conversation history, CopilotKit tools, and additional instructions", async () => {
      registerSecrets({ aiCursorKey: TEST_CURSOR_KEY });
      const createCalls: Record<string, any>[] = [];
      const sendPrompts: string[] = [];
      const { importSdk } = createRecordingImportSdk(createCalls, { sendPrompts });
      const agent = await createCursorAbstractAgent({
        importSdk,
        mcpHttpUrl: TEST_MCP_HTTP_URL,
        nodeVersion: "22.13.0",
      });

      const events$ = agent.run({
        threadId: "thread-history",
        runId: "run-history",
        messages: [
          { id: "m0", role: "user", content: "first question about lending" },
          { id: "m1", role: "assistant", content: "first answer from earlier turn" },
          { id: "m2", role: "user", content: "propose a lend for that book" },
        ],
        tools: [
          {
            name: "propose_lendDocument",
            description: "Show a lending review form",
            parameters: { type: "object" },
          },
          {
            name: "propose_generateMiroirEntity",
            description: "Show an entity review form",
            parameters: { type: "object" },
          },
        ],
        context: [
          {
            description: "Library",
            value: "Prefer propose_* review forms over MCP writes",
          },
        ],
        state: {},
        forwardedProps: {},
      } as RunAgentInput);

      await new Promise<void>((resolve, reject) => {
        events$.subscribe({ next: () => undefined, error: reject, complete: resolve });
      });

      expect(sendPrompts).toHaveLength(1);
      const prompt = sendPrompts[0];
      expect(prompt).toContain("first question about lending");
      expect(prompt).toContain("first answer from earlier turn");
      expect(prompt).toContain("propose a lend for that book");
      expect(prompt).toContain("propose_lendDocument");
      expect(prompt).toContain("propose_generateMiroirEntity");
      expect(prompt).toContain("Prefer propose_* review forms over MCP writes");
      expect(prompt).toContain("copilotkit-tool");

      await (agent as any)[Symbol.asyncDispose]?.();
    });

    it("maps CopilotKit-named SDK tool_call events to AG-UI TOOL_CALL_*", async () => {
      registerSecrets({ aiCursorKey: TEST_CURSOR_KEY });
      const createCalls: Record<string, any>[] = [];
      const { importSdk } = createRecordingImportSdk(createCalls, {
        streamEvents: [
          {
            type: "tool_call",
            call_id: "call-propose-lend",
            name: "propose_lendDocument",
            status: "running",
            args: { documentUuid: "doc-1", userUuid: "user-1" },
          },
        ],
      });
      const agent = await createCursorAbstractAgent({
        importSdk,
        mcpHttpUrl: TEST_MCP_HTTP_URL,
        nodeVersion: "22.13.0",
      });

      const events$ = agent.run({
        threadId: "thread-tools",
        runId: "run-tools",
        messages: [{ id: "m1", role: "user", content: "propose a lend" }],
        tools: [
          {
            name: "propose_lendDocument",
            description: "Show a lending review form",
            parameters: { type: "object" },
          },
        ],
        context: [],
        state: {},
        forwardedProps: {},
      } as RunAgentInput);

      const events: { type?: string; toolCallName?: string; toolCallId?: string; delta?: string }[] =
        [];
      await new Promise<void>((resolve, reject) => {
        events$.subscribe({
          next: (event) =>
            events.push(
              event as {
                type?: string;
                toolCallName?: string;
                toolCallId?: string;
                delta?: string;
              },
            ),
          error: reject,
          complete: resolve,
        });
      });

      expect(
        events.some(
          (event) =>
            event.type === EventType.TOOL_CALL_START &&
            event.toolCallName === "propose_lendDocument" &&
            event.toolCallId === "call-propose-lend",
        ),
      ).toBe(true);
      expect(
        events.some(
          (event) =>
            event.type === EventType.TOOL_CALL_ARGS &&
            event.toolCallId === "call-propose-lend" &&
            String(event.delta).includes("doc-1"),
        ),
      ).toBe(true);
      expect(
        events.some(
          (event) =>
            event.type === EventType.TOOL_CALL_END && event.toolCallId === "call-propose-lend",
        ),
      ).toBe(true);

      await (agent as any)[Symbol.asyncDispose]?.();
    });

    it("turns copilotkit-tool fences in assistant text into AG-UI TOOL_CALL_*", async () => {
      registerSecrets({ aiCursorKey: TEST_CURSOR_KEY });
      const createCalls: Record<string, any>[] = [];
      const { importSdk } = createRecordingImportSdk(createCalls, {
        streamEvents: [
          {
            type: "assistant",
            message: {
              content: [
                {
                  type: "text",
                  text:
                    "Here is a lending proposal.\n```copilotkit-tool\n" +
                    '{"name":"propose_lendDocument","arguments":{"documentUuid":"doc-1"}}\n' +
                    "```\n",
                },
              ],
            },
          },
        ],
      });
      const agent = await createCursorAbstractAgent({
        importSdk,
        mcpHttpUrl: TEST_MCP_HTTP_URL,
        nodeVersion: "22.13.0",
      });

      const events$ = agent.run({
        threadId: "thread-fence",
        runId: "run-fence",
        messages: [{ id: "m1", role: "user", content: "propose a lend" }],
        tools: [
          {
            name: "propose_lendDocument",
            description: "Show a lending review form",
            parameters: { type: "object" },
          },
        ],
        context: [],
        state: {},
        forwardedProps: {},
      } as RunAgentInput);

      const events: { type?: string; toolCallName?: string; toolCallId?: string; delta?: string }[] =
        [];
      await new Promise<void>((resolve, reject) => {
        events$.subscribe({
          next: (event) =>
            events.push(
              event as {
                type?: string;
                toolCallName?: string;
                toolCallId?: string;
                delta?: string;
              },
            ),
          error: reject,
          complete: resolve,
        });
      });

      const text = events
        .filter((event) => event.type === EventType.TEXT_MESSAGE_CONTENT)
        .map((event) => String(event.delta ?? ""))
        .join("");
      expect(text).toContain("Here is a lending proposal.");
      expect(text).not.toContain("copilotkit-tool");
      expect(
        events.some(
          (event) =>
            event.type === EventType.TOOL_CALL_START &&
            event.toolCallName === "propose_lendDocument",
        ),
      ).toBe(true);
      expect(
        events.some(
          (event) =>
            event.type === EventType.TOOL_CALL_ARGS && String(event.delta).includes("doc-1"),
        ),
      ).toBe(true);

      await (agent as any)[Symbol.asyncDispose]?.();
    });
  });

  describe("cursorSdk.275.phase4 — Node floor", () => {
    afterEach(() => {
      clearSecrets();
    });

    it("factory throws a Node-floor message when version is below 22.13.0", async () => {
      registerSecrets({ aiCursorKey: TEST_CURSOR_KEY });
      const createCalls: Record<string, any>[] = [];
      const { importSdk } = createRecordingImportSdk(createCalls);

      await expect(
        createCursorAbstractAgent({
          importSdk,
          mcpHttpUrl: TEST_MCP_HTTP_URL,
          nodeVersion: "20.0.0",
        }),
      ).rejects.toThrow(/22\.13\.0|Node/i);
      expect(createCalls).toHaveLength(0);
    });

    it("Cursor router branch returns 503 with a Node-floor message; token path still works", async () => {
      registerSecrets({
        aiCursorKey: TEST_CURSOR_KEY,
        aiOpenaiKey: "sk-test-openai",
        aiAnthropicKey: "sk-ant-test",
        aiGoogleKey: "aig-test",
        aiGithubToken: "gh-test-token",
      });
      process.env.AI_PROVIDER_TYPE = "openai";
      process.env.AI_MODEL = "gpt-4o";

      const createCalls: Record<string, any>[] = [];
      const { importSdk } = createRecordingImportSdk(createCalls);
      const seams = recordingSeams();
      const router = createCopilotKitRouter(undefined as any, {}, {
        capabilities: snapshot(),
        mcpHttpUrl: TEST_MCP_HTTP_URL,
        nodeVersion: "20.0.0",
        importSdk,
        createCopilotRuntime: seams.createCopilotRuntime,
        buildCopilotRuntime: seams.buildCopilotRuntime,
        copilotRuntimeNodeHttpEndpoint: seams.copilotRuntimeNodeHttpEndpoint,
      });

      const cursorResult = await postJson(router, CURSOR_ENVELOPE);
      expect(cursorResult.status).toBe(503);
      expect(JSON.stringify(cursorResult.body)).toMatch(/22\.13\.0|Node/i);
      expect(createCalls).toHaveLength(0);

      const tokenResult = await postJson(router, TOKEN_ENVELOPE);
      expect(tokenResult.status).toBe(200);
      expect(seams.tokenBuilds).toHaveLength(1);
      expect(seams.tokenBuilds[0].config).toMatchObject({ providerType: "openai", model: "gpt-4o" });

      delete process.env.AI_PROVIDER_TYPE;
      delete process.env.AI_MODEL;
    });
  });

  describe("cursorSdk.275.phase4 — default factory is wired into createCopilotKitRouter", () => {
    afterEach(() => {
      clearSecrets();
    });

    it("uses createCursorAbstractAgent when no factory is injected", async () => {
      registerSecrets({ aiCursorKey: TEST_CURSOR_KEY });
      const createCalls: Record<string, any>[] = [];
      const { importSdk } = createRecordingImportSdk(createCalls);
      const seams = recordingSeams();
      const router = createCopilotKitRouter(undefined as any, {}, {
        capabilities: snapshot(),
        mcpHttpUrl: TEST_MCP_HTTP_URL,
        nodeVersion: "22.13.0",
        importSdk,
        createCopilotRuntime: seams.createCopilotRuntime,
        buildCopilotRuntime: seams.buildCopilotRuntime,
        copilotRuntimeNodeHttpEndpoint: seams.copilotRuntimeNodeHttpEndpoint,
      });

      const result = await postJson(router, CURSOR_ENVELOPE);
      expect(result.status).toBe(200);
      expect(createCalls).toHaveLength(1);
      expect(seams.runtimeOptions).toHaveLength(1);
      expect(seams.runtimeOptions[0].agents.default).toBeInstanceOf(AbstractAgent);
      expect(seams.runtimeOptions[0].agents.cursor).toBeInstanceOf(AbstractAgent);
      expect(seams.runtimeOptions[0].agents.default).toBe(seams.runtimeOptions[0].agents.cursor);
      expect(seams.tokenBuilds).toHaveLength(0);
    });
  });

  describe("cursorSdk.275.phase4 — no static @cursor/sdk import on persistence entrypoints", () => {
    it("server.ts and ipcServerSetup.ts do not statically import @cursor/sdk", () => {
      const serverSrc = readRepoFile("packages/miroir-server/src/server.ts");
      const electronSrc = readRepoFile(
        "packages/miroir-standalone-app-electron/src/ipcServerSetup.ts",
      );
      for (const src of [serverSrc, electronSrc]) {
        expect(src).not.toContain('import "@cursor/sdk"');
        expect(src).not.toContain('from "@cursor/sdk"');
      }
    });
  });

  describe("cursorSdk.275.phase4 — package.json @cursor/sdk pin", () => {
    it("lists @cursor/sdk on miroir-ai only", () => {
      expect(packageHasCursorSdkDependency(readPackageJson("packages/miroir-ai/package.json"))).toBe(
        true,
      );
      const otherPackages = [
        "package.json",
        "packages/miroir-server/package.json",
        "packages/miroir-standalone-app/package.json",
        "packages/miroir-standalone-app-electron/package.json",
      ];
      for (const path of otherPackages) {
        expect(packageHasCursorSdkDependency(readPackageJson(path))).toBe(false);
      }
    });
  });

  describe("cursorSdk.275.phase4 — @cursor/sdk nested runtime deps are installed", () => {
    const sdkPackageJsonPath = join(
      REPO_ROOT,
      "packages/miroir-ai/node_modules/@cursor/sdk/package.json",
    );

    it("createRequire from the SDK package resolves each declared dependency", () => {
      expect(existsSync(sdkPackageJsonPath)).toBe(true);
      const sdkPkg = JSON.parse(readFileSync(sdkPackageJsonPath, "utf8")) as {
        dependencies?: Record<string, string>;
      };
      const requireFromSdk = createRequire(sdkPackageJsonPath);
      const names = Object.keys(sdkPkg.dependencies ?? {});
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        expect(() => requireFromSdk.resolve(name), name).not.toThrow();
      }
    });

    it("dynamic import('@cursor/sdk') loads from miroir-ai", async () => {
      await expect(import("@cursor/sdk")).resolves.toBeTruthy();
    });
  });

  describe("cursorSdk.275.phase4 — miroir-ai dist does not shadow protobuf v2 wire", () => {
    it("tsup leaves node_modules external", () => {
      const tsup = readRepoFile("packages/miroir-ai/tsup.config.ts");
      expect(tsup).toMatch(/skipNodeModulesBundle\s*:\s*true/);
    });

    it("dist/index.js does not import @bufbuild/protobuf/wire", () => {
      const dist = readRepoFile("packages/miroir-ai/dist/index.js");
      expect(
        dist.includes("@bufbuild/protobuf/wire"),
        "bundled dist must not import protobuf/wire; nested SDK protobuf 1.10 has no that export",
      ).toBe(false);
    });
  });
}
