/**
 * #409 Slice 4: a process loads only the agent SDK of its configured backend.
 * Child-process probe (built miroir-ai, stub SDKs): the child builds the router and sends one
 * agent request.
 * Do not register in FunctionCallTestRegistry.
 */
import { describe, expect, it } from "vitest";

import { loadedAgentSdks, runModuleLoadProbe } from "../../../support/moduleLoadProbe.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("agentBackend.409");

function capabilities(agentBackend: string) {
  return {
    ai: true,
    mcp: true,
    agentBackend,
    designerTools: true,
    availableStoreTypes: [],
    creatableStoreTypes: [],
    storeAdministration: false,
  };
}

if (runThis) {
  describe("agentBackend.409.phase4: only the picked agent SDK is loaded", () => {
    it("none: an agent request is refused and no agent SDK is loaded", () => {
      const result = runModuleLoadProbe({
        capabilities: capabilities("none"),
        secrets: { aiCursorKey: "cursor-probe-key", aiAnthropicKey: "anthropic-probe-key" },
        request: "agent",
      });
      expect(result.status).toBe(403);
      expect(loadedAgentSdks(result)).toEqual([]);
    }, 60_000);

    it("cursor: an agent request loads @cursor/sdk only", () => {
      const result = runModuleLoadProbe({
        capabilities: capabilities("cursor"),
        secrets: { aiCursorKey: "cursor-probe-key", aiAnthropicKey: "anthropic-probe-key" },
        request: "agent",
      });
      expect(result.status).toBe(200);
      expect(loadedAgentSdks(result)).toEqual(["@cursor/sdk"]);
    }, 60_000);

    it("claude: an agent request loads @anthropic-ai/claude-agent-sdk only", () => {
      const result = runModuleLoadProbe({
        capabilities: capabilities("claude"),
        secrets: { aiCursorKey: "cursor-probe-key", aiAnthropicKey: "anthropic-probe-key" },
        request: "agent",
      });
      expect(result.status).toBe(200);
      expect(loadedAgentSdks(result)).toEqual(["@anthropic-ai/claude-agent-sdk"]);
    }, 60_000);
  });
}
