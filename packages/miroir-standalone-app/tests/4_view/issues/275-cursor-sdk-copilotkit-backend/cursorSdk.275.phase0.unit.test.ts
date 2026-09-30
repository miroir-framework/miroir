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
    it("environmentBoot.ts electronServerConfig has designerTools and no cursor; the desktop environment (#345) has ai and mcp", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app-electron/src/environmentBoot.ts",
      );
      const start = src.indexOf("function electronServerConfig");
      expect(start).toBeGreaterThanOrEqual(0);
      const block = src.slice(start, src.indexOf("export async function bootElectronServer", start));
      expect(block).toMatch(/\bdesignerTools\s*:\s*true\b/);
      expect(block).not.toMatch(/\bcursor\s*:/);
      const desktop = JSON.parse(readRepoFile("environments/desktop.json"));
      expect(desktop.features).toEqual({ ai: true, mcp: true });
    });
  });

  describe("cursorSdk.275.phase0 — AgentsCopilotKit runtimeUrl pin", () => {
    it("AgentsCopilotKit.tsx has runtimeUrl", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx",
      );
      expect(src).toContain("runtimeUrl=");
    });
  });
}
