/**
 * #275 Slice 3 — CURSOR_API_KEY import alias (aiCursorKey), not a token adapter.
 * Do not register in FunctionCallTestRegistry.
 */
import { describe, expect, it } from "vitest";

import { AI_SECRET_IMPORT_ALIASES, assembleSecretImportSet } from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase3";

if (runThis) {
  describe("cursorSdk.275.phase3 — CURSOR_API_KEY import alias", () => {
    it("assembleSecretImportSet maps CURSOR_API_KEY to aiCursorKey", () => {
      const importSet = assembleSecretImportSet({}, { CURSOR_API_KEY: "ck-test" });
      expect(importSet).toEqual({ aiCursorKey: "ck-test" });
    });

    it("existing parsed aiCursorKey wins over CURSOR_API_KEY env", () => {
      const importSet = assembleSecretImportSet(
        { aiCursorKey: "already" },
        { CURSOR_API_KEY: "from-env" },
      );
      expect(importSet.aiCursorKey).toBe("already");
    });

    it("AI_SECRET_IMPORT_ALIASES has cursor row with CURSOR_API_KEY and aiCursorKey", () => {
      const cursorRow = Object.values(AI_SECRET_IMPORT_ALIASES).find(
        (alias) => alias.env === "CURSOR_API_KEY",
      );
      expect(cursorRow).toEqual({ env: "CURSOR_API_KEY", name: "aiCursorKey" });
    });
  });
}
