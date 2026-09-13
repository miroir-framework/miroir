/**
 * #275 Slice 5 — propose_* rename + lend review form (source-text of AiActionsProvider + AiEntityProposalForm).
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
  RUN_TEST === "cursorSdk.275.phase5";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

const LOOKUP_ACTION_NAMES = [
  "getMiroirContext",
  "lookupApplicationByName",
  "lookupDeploymentByApplicationUuid",
  "lookupEntityByName",
  "findInstanceByName",
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
  describe("cursorSdk.275.phase5 — propose_* frontend action names", () => {
    const providerSrc = readRepoFile(
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AiActionsProvider.tsx",
    );
    const formSrc = readRepoFile(
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AiEntityProposalForm.tsx",
    );

    it("registers propose_generateMiroirEntity and propose_lendDocument", () => {
      expect(providerSrc).toContain('name: "propose_generateMiroirEntity"');
      expect(providerSrc).toContain('name: "propose_lendDocument"');
    });

    it("both propose_* action blocks contain renderAndWaitForResponse", () => {
      expect(actionBlock(providerSrc, "propose_generateMiroirEntity")).toContain(
        "renderAndWaitForResponse",
      );
      expect(actionBlock(providerSrc, "propose_lendDocument")).toContain(
        "renderAndWaitForResponse",
      );
    });

    it("does not register useCopilotAction name lendDocument or generateMiroirEntity", () => {
      const registered = extractUseCopilotActionNames(providerSrc);
      expect(registered).not.toContain("lendDocument");
      expect(registered).not.toContain("generateMiroirEntity");
      expect(providerSrc).not.toContain('name: "lendDocument"');
      expect(providerSrc).not.toContain('name: "generateMiroirEntity"');
    });

    it("keeps lookup action names unchanged", () => {
      const registered = extractUseCopilotActionNames(providerSrc);
      for (const name of LOOKUP_ACTION_NAMES) {
        expect(registered).toContain(name);
        expect(providerSrc).toContain(`name: "${name}"`);
      }
    });

    it("keeps getCurrentDate and getCurrentTimestamp names unchanged", () => {
      const registered = extractUseCopilotActionNames(providerSrc);
      expect(registered).toContain("getCurrentDate");
      expect(registered).toContain("getCurrentTimestamp");
      expect(providerSrc).toContain('name: "getCurrentDate"');
      expect(providerSrc).toContain('name: "getCurrentTimestamp"');
    });

    it("propose_lendDocument accept path POSTs /lendDocument", () => {
      const block = actionBlock(providerSrc, "propose_lendDocument");
      expect(block).toMatch(/copilotKitHttpUrl\("\/lendDocument"\)|["']\/lendDocument["']/);
      expect(block).toMatch(/JSON\.stringify\(\s*\{\s*user,\s*book,\s*startDate,\s*note\s*\}/);
    });

    it("reuses AiEntityProposalForm for the entity proposal", () => {
      expect(formSrc).toContain("export function AiEntityProposalForm");
      expect(providerSrc).toContain("AiEntityProposalForm");
    });
  });
}
