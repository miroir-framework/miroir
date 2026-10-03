/**
 * Agent backends (#409): `features.agentBackend` picks the agent backend before start, and the process
 * capabilities report it. `features.cursor: true` stays readable as an alias for one release.
 * Do not register in FunctionCallTestRegistry.
 */
import { describe, expect, it } from "vitest";

import {
  FAIL_CLOSED_PROCESS_CAPABILITIES,
  getProcessCapabilities,
  isAgentBackendAllowed,
  miroirEnvironment,
  type ProcessCapabilities,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("agentBackendCapabilities");

const emptyMap = new Map<string, unknown>();

function agentBackendFor(features: Record<string, unknown> | undefined): ProcessCapabilities["agentBackend"] {
  return getProcessCapabilities({
    config: { features: features as any },
    environment: "node",
    storeSectionFactoryRegister: emptyMap,
    adminStoreFactoryRegister: emptyMap,
  }).agentBackend;
}

function snapshot(overrides: Partial<ProcessCapabilities>): ProcessCapabilities {
  return { ...FAIL_CLOSED_PROCESS_CAPABILITIES, ai: true, mcp: true, ...overrides };
}

if (runThis) {
  describe("agentBackendCapabilities: agentBackend in process capabilities", () => {
    it("reports the configured backend", () => {
      expect(agentBackendFor({ agentBackend: "cursor" })).toBe("cursor");
      expect(agentBackendFor({ agentBackend: "claude" })).toBe("claude");
      expect(agentBackendFor({ agentBackend: "none" })).toBe("none");
    });

    it("is none when nothing is configured", () => {
      expect(agentBackendFor(undefined)).toBe("none");
      expect(agentBackendFor({})).toBe("none");
      expect(FAIL_CLOSED_PROCESS_CAPABILITIES.agentBackend).toBe("none");
    });

    it("reads features.cursor: true as cursor when agentBackend is absent", () => {
      expect(agentBackendFor({ cursor: true })).toBe("cursor");
      expect(agentBackendFor({ cursor: false })).toBe("none");
    });

    it("lets an explicit agentBackend win over features.cursor", () => {
      expect(agentBackendFor({ agentBackend: "none", cursor: true })).toBe("none");
      expect(agentBackendFor({ agentBackend: "claude", cursor: true })).toBe("claude");
    });

    it("allows an agent only with ai, mcp and a backend other than none", () => {
      expect(isAgentBackendAllowed(snapshot({ agentBackend: "claude" }))).toBe(true);
      expect(isAgentBackendAllowed(snapshot({ agentBackend: "cursor" }))).toBe(true);
      expect(isAgentBackendAllowed(snapshot({ agentBackend: "none" }))).toBe(false);
      expect(isAgentBackendAllowed(snapshot({ agentBackend: "claude", mcp: false }))).toBe(false);
      expect(isAgentBackendAllowed(snapshot({ agentBackend: "claude", ai: false }))).toBe(false);
    });
  });

  describe("agentBackendCapabilities: agentBackend and agentModel in the environment schema", () => {
    const features = { ai: true, mcp: true, agentBackend: "claude", agentModel: "claude-sonnet-5-5" };

    it("accepts them in an environment definition", () => {
      expect(miroirEnvironment.safeParse({ name: "probe", features }).success).toBe(true);
    });

    it("rejects an unknown backend", () => {
      expect(miroirEnvironment.safeParse({ name: "probe", features: { agentBackend: "gemini" } }).success).toBe(false);
    });
  });
}
