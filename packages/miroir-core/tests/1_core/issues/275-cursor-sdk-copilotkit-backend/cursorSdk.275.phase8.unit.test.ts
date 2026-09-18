/**
 * #275 Slice 8 — nonreg manifest + operator docs for features.cursor.
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
  RUN_TEST === "cursorSdk.275.phase8";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

function readText(relativePathFromRepoRoot: string): string {
  return readFileSync(join(REPO_ROOT, relativePathFromRepoRoot), "utf8");
}

if (runThis) {
  describe("cursorSdk.275.phase8 — nonreg manifest includes unit-275-cursor-sdk", () => {
    it("scripts/nonreg-manifest.json has id unit-275-cursor-sdk with tier unit", () => {
      const manifest = JSON.parse(readText("scripts/nonreg-manifest.json")) as {
        steps: Array<{ id: string; tier: string }>;
      };
      const step = manifest.steps.find((s) => s.id === "unit-275-cursor-sdk");
      expect(step).toBeDefined();
      expect(step?.tier).toBe("unit");
    });
  });

  describe("cursorSdk.275.phase8 — process-capabilities docs name features.cursor and Node floor", () => {
    it("docs/reference/process-capabilities.md mentions features.cursor and 22.13", () => {
      const doc = readText("docs/reference/process-capabilities.md");
      expect(doc).toMatch(/features\.cursor|`cursor`/);
      expect(doc).toContain("22.13");
    });

    it("shipped server JSON omits cursor; using-ai.md says the shipped file does not turn it on", () => {
      const capabilities = readText("docs/reference/process-capabilities.md");
      const usingAi = readText("docs/guides/using-ai.md");
      expect(capabilities).toMatch(/Shipped `miroirConfig\.server\.json` \/ `\.docker\.json` omit `cursor`/);
      expect(usingAi).toContain("does **not** turn `cursor` on");
    });
  });
}
