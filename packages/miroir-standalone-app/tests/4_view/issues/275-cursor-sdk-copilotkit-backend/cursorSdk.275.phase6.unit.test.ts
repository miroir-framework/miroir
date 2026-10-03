/**
 * #275 Slice 6 — sessionStorage picker sets CopilotKit `properties`.
 * Do not register in FunctionCallTestRegistry.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

import {
  readMiroirAiBackend,
  writeMiroirAiBackend,
} from "../../../../src/miroir-fwk/4_view/routes/ai/miroirAiBackend.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase6";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const VIEW_SRC = join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4_view");
const MIROIR_AI_BACKEND_KEY = "miroirAiBackend";

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

function collectTsFiles(root: string): string[] {
  const found: string[] = [];
  if (!existsSync(root)) {
    return found;
  }
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "tests" || entry.name.endsWith(".test")) {
          continue;
        }
        walk(full);
        continue;
      }
      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        found.push(full);
      }
    }
  };
  walk(root);
  return found;
}

if (runThis) {
  describe("cursorSdk.275.phase6 — sessionStorage helpers", () => {
    beforeEach(() => {
      sessionStorage.removeItem(MIROIR_AI_BACKEND_KEY);
    });

    it("absent key is no agent pick", () => {
      expect(sessionStorage.getItem(MIROIR_AI_BACKEND_KEY)).toBeNull();
      expect(readMiroirAiBackend()).toBeUndefined();
    });

    it("writeMiroirAiBackend(\"agent\") stores key miroirAiBackend (#409)", () => {
      writeMiroirAiBackend("agent");
      expect(sessionStorage.getItem(MIROIR_AI_BACKEND_KEY)).toBe("agent");
      expect(readMiroirAiBackend()).toBe("agent");
    });

    it("clearing the pick removes miroirAiBackend", () => {
      writeMiroirAiBackend("agent");
      writeMiroirAiBackend();
      expect(sessionStorage.getItem(MIROIR_AI_BACKEND_KEY)).toBeNull();
      expect(readMiroirAiBackend()).toBeUndefined();
    });
  });

  describe("cursorSdk.275.phase6 — AgentsCopilotKit properties", () => {
    it("source passes agent request properties when pick and snapshot allow it (#409)", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx",
      );
      expect(src).toContain("properties");
      expect(src).toContain("agentRequestProperties(");
      expect(src).toContain("readMiroirAiBackend");
      expect(src).toContain("processCapabilities.agentBackend");
    });

    it("memoizes CopilotKit properties so the provider does not reset on every render", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx",
      );
      expect(src).toMatch(/useMemo\s*\(/);
      expect(src).toMatch(/properties=\{copilotProperties\}|properties=\{properties\}/);
    });

    it("registers one shared default ProxiedCopilotRuntimeAgent for CopilotSidebar", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx",
      );
      expect(src).toContain("ProxiedCopilotRuntimeAgent");
      expect(src).toContain("selfManagedAgents");
      expect(src).toMatch(/agentId:\s*"default"/);
      expect(src).toMatch(/transport:\s*"single"/);
    });
  });

  describe("cursorSdk.275.phase6 — AppBar Cursor picker gate", () => {
    it("picker is shown only when AI shell and snapshot cursor are both true", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx",
      );
      expect(src).toMatch(/aria-label=\{agentLabel\}/);
      const cursorIdx = src.search(/aria-label=\{agentLabel\}/);
      expect(cursorIdx).toBeGreaterThanOrEqual(0);
      const windowStart = Math.max(0, cursorIdx - 400);
      const aroundPicker = src.slice(windowStart, cursorIdx + 200);
      const gatedByShowAgentUiAndCursor =
        aroundPicker.includes("showAgentUi") && aroundPicker.includes("agentLabel");
      const gatedByAiAndCursor =
        /\.ai\b/.test(aroundPicker) && aroundPicker.includes("agentLabel");
      expect(gatedByShowAgentUiAndCursor || gatedByAiAndCursor).toBe(true);
    });
  });

  describe("cursorSdk.275.phase6 — no getProcessCapabilities in 4_view", () => {
    it("4_view sources do not contain getProcessCapabilities", () => {
      const viewFiles = collectTsFiles(VIEW_SRC);
      expect(viewFiles.length).toBeGreaterThan(0);
      for (const file of viewFiles) {
        expect(readFileSync(file, "utf8"), file).not.toContain("getProcessCapabilities");
      }
    });
  });
}
