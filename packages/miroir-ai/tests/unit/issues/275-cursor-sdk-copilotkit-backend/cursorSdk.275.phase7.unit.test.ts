/**
 * #275 Slice 7 — assertCursorSdkPackaged fail-loud helper.
 * Do not register in FunctionCallTestRegistry.
 */
import { describe, expect, it } from "vitest";

import { assertCursorSdkPackaged } from "../../../../src/runtime/assertCursorSdkPackaged.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase7";

if (runThis) {
  describe("cursorSdk.275.phase7 — assertCursorSdkPackaged", () => {
    it("throws when resolveSdkPath returns undefined", () => {
      expect(() =>
        assertCursorSdkPackaged({
          resolveSdkPath: () => undefined,
        }),
      ).toThrow(/not packaged|@cursor\/sdk/i);
    });

    it("throws when the resolved path does not exist", () => {
      expect(() =>
        assertCursorSdkPackaged({
          resolveSdkPath: () => "/missing/@cursor/sdk",
          existsSync: () => false,
        }),
      ).toThrow(/not packaged|@cursor\/sdk/i);
    });

    it("does not throw when an injectable path exists", () => {
      expect(() =>
        assertCursorSdkPackaged({
          resolveSdkPath: () => "/packaged/@cursor/sdk",
          existsSync: (candidate) => candidate === "/packaged/@cursor/sdk",
        }),
      ).not.toThrow();
    });
  });
}
