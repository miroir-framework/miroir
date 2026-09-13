/**
 * #275 Slice 0 — characterize today's frontend CopilotKit / AI action contracts (no cursor yet).
 * Do not register in FunctionCallTestRegistry.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase0";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

const EXPECTED_USE_COPILOT_ACTION_NAMES = [
  "propose_generateMiroirEntity",
  "getMiroirContext",
  "lookupApplicationByName",
  "lookupDeploymentByApplicationUuid",
  "lookupEntityByName",
  "findInstanceByName",
  "propose_lendDocument",
  "getCurrentDate",
  "getCurrentTimestamp",
];

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

function extractUseCopilotActionNames(src: string): string[] {
  const names: string[] = [];
  const re = /useCopilotAction\s*\(\s*\{[^}]*?\bname:\s*"([^"]+)"/gs;
  for (const match of src.matchAll(re)) {
    names.push(match[1]);
  }
  return names;
}

function actionBlock(src: string, actionName: string): string {
  const marker = `name: "${actionName}"`;
  const start = src.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const nextUse = src.indexOf("useCopilotAction(", start + marker.length);
  return nextUse > start ? src.slice(start, nextUse) : src.slice(start, start + 2000);
}

if (runThis) {
  describe("cursorSdk.275.phase0 — AiActionsProvider useCopilotAction names", () => {
    it("registers exactly nine frontend action names", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AiActionsProvider.tsx",
      );
      expect(extractUseCopilotActionNames(src).sort()).toEqual(
        [...EXPECTED_USE_COPILOT_ACTION_NAMES].sort(),
      );
    });

    it("only propose_generateMiroirEntity and propose_lendDocument use renderAndWaitForResponse", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AiActionsProvider.tsx",
      );
      const namesWithRender = EXPECTED_USE_COPILOT_ACTION_NAMES.filter((name) =>
        actionBlock(src, name).includes("renderAndWaitForResponse"),
      );
      expect(namesWithRender).toEqual(["propose_generateMiroirEntity", "propose_lendDocument"]);
    });
  });

  describe("cursorSdk.275.phase0 — RootComponent CopilotKit latch uses snapshot ai", () => {
    it("agentsEnabled reads context.processCapabilities.ai", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx",
      );
      expect(src).toContain("context.processCapabilities.ai === true");
      expect(src).toContain("const AgentsCopilotKit = lazy(");
      expect(src).toContain("shouldMountCopilotKit");
    });
  });

  describe("cursorSdk.275.phase0 — Electron electronServerConfig features", () => {
    it("ipcServerSetup.ts electronServerConfig has ai, mcp, designerTools and no cursor", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app-electron/src/ipcServerSetup.ts",
      );
      const start = src.indexOf("const electronServerConfig");
      expect(start).toBeGreaterThanOrEqual(0);
      const block = src.slice(start, src.indexOf("const miroirContext", start));
      expect(block).toMatch(/\bfeatures\s*:/);
      expect(block).toMatch(/\bai\s*:\s*true\b/);
      expect(block).toMatch(/\bmcp\s*:\s*true\b/);
      expect(block).toMatch(/\bdesignerTools\s*:\s*true\b/);
      expect(block).not.toMatch(/\bcursor\s*:/);
    });
  });

  describe("cursorSdk.275.phase0 — AgentsCopilotKit runtimeUrl pin", () => {
    it("AgentsCopilotKit.tsx has runtimeUrl and no properties or aiConfig.backend", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx",
      );
      expect(src).toContain("runtimeUrl=");
      expect(src).not.toContain("properties");
      expect(src).not.toContain("aiConfig.backend");
    });
  });
}
