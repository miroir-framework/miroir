/**
 * #275 Slice 7 — fail-loud Cursor SDK packaging check (assertAgentSdkPackaged since #409).
 * Do not register in FunctionCallTestRegistry.
 */
import { describe, expect, it } from "vitest";

import { assertAgentSdkPackaged } from "../../../../src/runtime/assertAgentSdkPackaged.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase7";

if (runThis) {
  describe("cursorSdk.275.phase7 — assertAgentSdkPackaged(\"cursor\")", () => {
    it("throws when resolveSdkPath returns undefined", () => {
      expect(() =>
        assertAgentSdkPackaged("cursor", {
          resolveSdkPath: () => undefined,
        }),
      ).toThrow(/not packaged|@cursor\/sdk/i);
    });

    it("throws when the resolved path does not exist", () => {
      expect(() =>
        assertAgentSdkPackaged("cursor", {
          resolveSdkPath: () => "/missing/@cursor/sdk",
          existsSync: () => false,
        }),
      ).toThrow(/not packaged|@cursor\/sdk/i);
    });

    it("does not throw when an injectable path exists", () => {
      expect(() =>
        assertAgentSdkPackaged("cursor", {
          resolveSdkPath: () => "/packaged/@cursor/sdk",
          existsSync: (candidate) => candidate === "/packaged/@cursor/sdk",
        }),
      ).not.toThrow();
    });
  });
}
