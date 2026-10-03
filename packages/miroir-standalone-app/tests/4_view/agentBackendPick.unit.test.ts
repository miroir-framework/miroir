/**
 * Agent backends (#409): the browser asks for "the agent" and names the configured backend.
 * Do not register in FunctionCallTestRegistry.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { FAIL_CLOSED_PROCESS_CAPABILITIES, type ProcessCapabilities } from "miroir-core";

import {
  agentBackendLabel,
  agentRequestProperties,
} from "../../src/miroir-fwk/4_view/routes/ai/agentBackendPick.js";
import {
  MIROIR_AI_BACKEND_STORAGE_KEY,
  readMiroirAiBackend,
  writeMiroirAiBackend,
} from "../../src/miroir-fwk/4_view/routes/ai/miroirAiBackend.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("agentBackendPick");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const AI_ROUTES = "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai";

function capabilities(overrides: Partial<ProcessCapabilities>): ProcessCapabilities {
  return { ...FAIL_CLOSED_PROCESS_CAPABILITIES, ai: true, mcp: true, ...overrides };
}

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

if (runThis) {
  describe("agentBackendPick: toggle label", () => {
    it("names the configured backend", () => {
      expect(agentBackendLabel(capabilities({ agentBackend: "claude" }))).toBe("Claude");
      expect(agentBackendLabel(capabilities({ agentBackend: "cursor" }))).toBe("Cursor");
    });

    it("has no toggle when the backend is none", () => {
      expect(agentBackendLabel(capabilities({ agentBackend: "none" }))).toBeUndefined();
    });
  });

  describe("agentBackendPick: session pick", () => {
    beforeEach(() => {
      sessionStorage.removeItem(MIROIR_AI_BACKEND_STORAGE_KEY);
    });

    it("stores 'agent' when the toggle turns the agent on", () => {
      writeMiroirAiBackend("agent");
      expect(sessionStorage.getItem(MIROIR_AI_BACKEND_STORAGE_KEY)).toBe("agent");
      expect(readMiroirAiBackend()).toBe("agent");
    });

    it("reads a stale 'cursor' value as 'agent'", () => {
      sessionStorage.setItem(MIROIR_AI_BACKEND_STORAGE_KEY, "cursor");
      expect(readMiroirAiBackend()).toBe("agent");
    });

    it("clears the pick when the toggle turns the agent off", () => {
      writeMiroirAiBackend("agent");
      writeMiroirAiBackend();
      expect(readMiroirAiBackend()).toBeUndefined();
    });
  });

  describe("agentBackendPick: chat request properties", () => {
    it("asks for the agent when picked and a backend is configured", () => {
      expect(agentRequestProperties("agent", "claude")).toEqual({
        aiConfig: { backend: "agent" },
      });
    });

    it("sends no agent property when the backend is none or nothing is picked", () => {
      expect(agentRequestProperties("agent", "none")).toBeUndefined();
      expect(agentRequestProperties(undefined, "claude")).toBeUndefined();
    });

    it("AgentsCopilotKit and AppBar use these helpers", () => {
      expect(readRepoFile(`${AI_ROUTES}/AgentsCopilotKit.tsx`)).toContain("agentRequestProperties(");
      expect(
        readRepoFile("packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx"),
      ).toContain("agentBackendLabel(");
    });
  });
}
