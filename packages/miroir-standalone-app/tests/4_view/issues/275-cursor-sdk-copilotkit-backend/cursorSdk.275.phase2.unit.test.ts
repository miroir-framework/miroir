/**
 * #275 Slice 2 — source-text pins for propose_generateMiroirEntity (R6) and production snapshot wiring.
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
  RUN_TEST === "cursorSdk.275.phase2";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

function actionBlock(src: string, actionName: string): string {
  const marker = `name: "${actionName}"`;
  const start = src.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const nextUse = src.indexOf("useCopilotAction(", start + marker.length);
  return nextUse > start ? src.slice(start, nextUse) : src.slice(start, start + 2000);
}

if (runThis) {
  describe("cursorSdk.275.phase2 — propose_generateMiroirEntity still uses renderAndWaitForResponse", () => {
    it("AiActionsProvider.tsx propose_generateMiroirEntity block contains renderAndWaitForResponse", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AiActionsProvider.tsx",
      );
      expect(src).toContain('name: "propose_generateMiroirEntity"');
      expect(actionBlock(src, "propose_generateMiroirEntity")).toContain("renderAndWaitForResponse");
    });
  });

  describe("cursorSdk.275.phase2 — production callers pass capabilities", () => {
    it("server.ts passes capabilities into createCopilotKitRouter", () => {
      const src = readRepoFile("packages/miroir-server/src/server.ts");
      expect(src).toContain(
        "createCopilotKitRouter(domainController, applicationDeploymentMap, { capabilities, mcpHttpUrl })",
      );
    });

    it("ipcServerSetup.ts passes capabilities into createCopilotKitRouter", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app-electron/src/ipcServerSetup.ts",
      );
      expect(src).toContain(
        "createCopilotKitRouter(domainController, defaultSelfApplicationDeploymentMap, { capabilities, mcpHttpUrl })",
      );
    });
  });
}
