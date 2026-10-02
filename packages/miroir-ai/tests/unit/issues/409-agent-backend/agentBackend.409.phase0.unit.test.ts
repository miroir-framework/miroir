/**
 * #409 Slice 0: characterize which agent SDK modules a process loads with today's `cursor`
 * capability, through the module-load probe (child process, built miroir-ai, stub SDKs).
 * Do not register in FunctionCallTestRegistry.
 */
import { describe, expect, it } from "vitest";

import { loadedAgentSdks, runModuleLoadProbe } from "../../../support/moduleLoadProbe.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("agentBackend.409");

const CURSOR_CAPABILITIES = {
  ai: true,
  mcp: true,
  cursor: true,
  designerTools: true,
  availableStoreTypes: [],
  creatableStoreTypes: [],
  storeAdministration: false,
};

if (runThis) {
  describe("agentBackend.409.phase0: module loading with the cursor capability", () => {
    it("building the router loads no agent SDK", () => {
      const result = runModuleLoadProbe({ capabilities: CURSOR_CAPABILITIES });
      expect(loadedAgentSdks(result)).toEqual([]);
    }, 60_000);

    it("one Cursor request loads @cursor/sdk and nothing else", () => {
      const result = runModuleLoadProbe({
        capabilities: CURSOR_CAPABILITIES,
        secrets: { aiCursorKey: "cursor-probe-key" },
        request: "cursor",
      });
      expect(result.status).toBe(200);
      expect(loadedAgentSdks(result)).toEqual(["@cursor/sdk"]);
    }, 60_000);

    it("importing miroir-ai loads the token provider SDKs eagerly (#410 gap)", () => {
      const result = runModuleLoadProbe({ capabilities: CURSOR_CAPABILITIES });
      expect(result.resolvedSpecifiers.has("openai")).toBe(true);
      expect(result.resolvedSpecifiers.has("@anthropic-ai/sdk")).toBe(true);
    }, 60_000);
  });
}
