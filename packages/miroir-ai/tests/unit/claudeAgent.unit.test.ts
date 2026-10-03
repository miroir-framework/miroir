/**
 * Claude agent (#409): with agentBackend "claude", an agent request runs a Claude Agent SDK session
 * (offline stub through the injected importer) and streams its text and CopilotKit tool calls
 * back as AG-UI events.
 * Do not register in FunctionCallTestRegistry.
 */
import { basename } from "node:path";
import { firstValueFrom, toArray } from "rxjs";
import { afterEach, describe, expect, it } from "vitest";
import { EventType, type BaseEvent, type RunAgentInput } from "@ag-ui/core";
import { clearSecrets, registerSecrets } from "miroir-core";

import { createClaudeAbstractAgent } from "../../src/runtime/claudeAgent.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("claudeAgent");

const TEST_ANTHROPIC_KEY = "anthropic-probe-key";
const TEST_MCP_HTTP_URL = "http://127.0.0.1:4173/mcp";

function recordingClaudeSdk(messages: unknown[]) {
  const queries: Array<{ prompt: unknown; options: Record<string, any> }> = [];
  let importCount = 0;
  const importSdk = async () => {
    importCount += 1;
    return {
      query: (params: { prompt: unknown; options: Record<string, any> }) => {
        queries.push(params);
        return (async function* () {
          yield* messages;
        })();
      },
    };
  };
  return { importSdk, queries, importCount: () => importCount };
}

const RUN_INPUT: RunAgentInput = {
  threadId: "thread-409",
  runId: "run-409",
  messages: [{ id: "m1", role: "user", content: "Create a report on books" }],
  tools: [{ name: "propose_newReport", description: "Show the new report form", parameters: {} }],
  context: [],
  state: {},
  forwardedProps: {},
} as RunAgentInput;

const CLAUDE_MESSAGES = [
  { type: "system", subtype: "init" },
  { type: "assistant", message: { content: [{ type: "text", text: "Here is the report." }] } },
  {
    type: "assistant",
    message: {
      content: [
        { type: "tool_use", id: "toolu_1", name: "mcp__miroir__listEntities", input: {} },
        { type: "tool_use", id: "toolu_2", name: "propose_newReport", input: { name: "Books" } },
      ],
    },
  },
  { type: "result", subtype: "success", result: "Here is the report." },
];

async function runEvents(agent: { run: (input: RunAgentInput) => any }): Promise<BaseEvent[]> {
  return firstValueFrom(agent.run(RUN_INPUT).pipe(toArray())) as Promise<BaseEvent[]>;
}

if (runThis) {
  describe("claudeAgent: Claude agent session", () => {
    afterEach(() => {
      clearSecrets();
    });

    it("streams the assistant text and only the CopilotKit tool call as AG-UI events", async () => {
      registerSecrets({ aiAnthropicKey: TEST_ANTHROPIC_KEY });
      const sdk = recordingClaudeSdk(CLAUDE_MESSAGES);
      const agent = await createClaudeAbstractAgent({ importSdk: sdk.importSdk, mcpHttpUrl: TEST_MCP_HTTP_URL });

      const events = await runEvents(agent);
      const types = events.map((event) => event.type);

      expect(types[0]).toBe(EventType.RUN_STARTED);
      expect(types[types.length - 1]).toBe(EventType.RUN_FINISHED);
      const text = events
        .filter((event) => event.type === EventType.TEXT_MESSAGE_CONTENT)
        .map((event: any) => event.delta)
        .join("");
      expect(text).toBe("Here is the report.");
      const toolStarts = events.filter((event) => event.type === EventType.TOOL_CALL_START) as any[];
      expect(toolStarts.map((event) => event.toolCallName)).toEqual(["propose_newReport"]);
    });

    it("runs Claude with only the Miroir MCP tools, in a scratch directory, with the configured model", async () => {
      registerSecrets({ aiAnthropicKey: TEST_ANTHROPIC_KEY });
      const sdk = recordingClaudeSdk(CLAUDE_MESSAGES);
      const agent = await createClaudeAbstractAgent({
        importSdk: sdk.importSdk,
        mcpHttpUrl: TEST_MCP_HTTP_URL,
        model: "claude-sonnet-5-5",
      });
      await runEvents(agent);

      expect(sdk.queries).toHaveLength(1);
      const options = sdk.queries[0].options;
      expect(typeof sdk.queries[0].prompt).toBe("string");
      expect(sdk.queries[0].prompt).toContain("Create a report on books");
      expect(options.model).toBe("claude-sonnet-5-5");
      expect(options.tools).toEqual([]);
      expect(options.allowedTools).toEqual(["mcp__miroir__*"]);
      expect(options.permissionMode).toBe("dontAsk");
      expect(options.settingSources).toEqual([]);
      expect(options.strictMcpConfig).toBe(true);
      expect(options.mcpServers).toEqual({ miroir: { type: "http", url: TEST_MCP_HTTP_URL } });
      expect(basename(options.cwd)).toBe(".miroir-claude-cwd");
    });

    it("defaults the model to claude-opus-5-5", async () => {
      registerSecrets({ aiAnthropicKey: TEST_ANTHROPIC_KEY });
      const sdk = recordingClaudeSdk(CLAUDE_MESSAGES);
      const agent = await createClaudeAbstractAgent({ importSdk: sdk.importSdk, mcpHttpUrl: TEST_MCP_HTTP_URL });
      await runEvents(agent);
      expect(sdk.queries[0].options.model).toBe("claude-opus-5-5");
    });

    it("gives the key to the Claude subprocess only, through env", async () => {
      registerSecrets({ aiAnthropicKey: TEST_ANTHROPIC_KEY });
      const keyBefore = process.env.ANTHROPIC_API_KEY;
      const sdk = recordingClaudeSdk(CLAUDE_MESSAGES);
      const agent = await createClaudeAbstractAgent({ importSdk: sdk.importSdk, mcpHttpUrl: TEST_MCP_HTTP_URL });
      await runEvents(agent);

      const env = sdk.queries[0].options.env;
      expect(env.ANTHROPIC_API_KEY).toBe(TEST_ANTHROPIC_KEY);
      expect(env.PATH).toBe(process.env.PATH);
      expect(process.env.ANTHROPIC_API_KEY).toBe(keyBefore);
    });

    it("imports the SDK once for several agents", async () => {
      registerSecrets({ aiAnthropicKey: TEST_ANTHROPIC_KEY });
      const sdk = recordingClaudeSdk(CLAUDE_MESSAGES);
      await createClaudeAbstractAgent({ importSdk: sdk.importSdk, mcpHttpUrl: TEST_MCP_HTTP_URL });
      await createClaudeAbstractAgent({ importSdk: sdk.importSdk, mcpHttpUrl: TEST_MCP_HTTP_URL });
      expect(sdk.importCount()).toBe(1);
    });

    it("fails with the missing secret name when aiAnthropicKey is not set", async () => {
      const sdk = recordingClaudeSdk(CLAUDE_MESSAGES);
      await expect(
        createClaudeAbstractAgent({ importSdk: sdk.importSdk, mcpHttpUrl: TEST_MCP_HTTP_URL }),
      ).rejects.toThrow(/aiAnthropicKey/);
      expect(sdk.importCount()).toBe(0);
    });
  });
}
