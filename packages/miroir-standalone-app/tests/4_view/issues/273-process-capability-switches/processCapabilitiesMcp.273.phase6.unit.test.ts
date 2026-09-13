/**
 * #273 Slice 6 — MCP refuse in runMcpToolRunner + both server mounts gated.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { shouldMountMcpHttp, type Runner } from "miroir-core";
import type { McpHttpFetch } from "miroir-mcp/client";
import { runnerMcpGetInstances } from "miroir-test-app_deployment-miroir";

import { runMcpToolRunner } from "../../../../src/miroir-fwk/4_view/components/Runners/runMcpToolRunner.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilitiesMcp.273.phase6" ||
  RUN_TEST.startsWith("processCapabilitiesMcp.273");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

if (runThis) {
  describe("processCapabilitiesMcp.273.phase6 — runMcpToolRunner refuses when mcp is false", () => {
    it("returns FeatureUnavailable without fetching", async () => {
      let fetchCalled = false;
      const throwingFetch: McpHttpFetch = () => {
        fetchCalled = true;
        throw new Error("throwingFetch must not run when mcp is false");
      };

      const envelope = await runMcpToolRunner(
        runnerMcpGetInstances as Runner,
        {},
        "http://127.0.0.1:9",
        { mcp: false },
        throwingFetch,
      );

      expect(envelope.status).toBe("error");
      expect(envelope.error?.type).toBe("FeatureUnavailable");
      expect(envelope.error?.type).not.toBe("FailedToHandleAction");
      expect(envelope.error?.capability).toBe("mcp");
      expect(fetchCalled).toBe(false);
    });
  });

  describe("processCapabilitiesMcp.273.phase6 — shouldMountMcpHttp", () => {
    it("shouldMountMcpHttp is false when mcp is false and true when mcp is true", () => {
      expect(shouldMountMcpHttp(false)).toBe(false);
      expect(shouldMountMcpHttp(true)).toBe(true);
    });
  });

  describe("processCapabilitiesMcp.273.phase6 — server.ts MCP mounts are gated", () => {
    it("server.ts contains shouldMountMcpHttp and still has mountHttpRoutes and mcpServer.run", () => {
      const src = readFileSync(join(REPO_ROOT, "packages/miroir-server/src/server.ts"), "utf8");
      expect(src).toContain("shouldMountMcpHttp");
      expect(src).toContain("mountHttpRoutes");
      expect(src).toContain("mcpServer.run");
    });
  });
}
