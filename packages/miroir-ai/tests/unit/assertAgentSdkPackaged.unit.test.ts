/**
 * Agent backends (#409): a packaged process whose picked agent SDK is missing fails at start with a
 * message naming the SDK and `features.agentBackend`.
 * Do not register in FunctionCallTestRegistry.
 */
import { describe, expect, it } from "vitest";

import { assertAgentSdkPackaged } from "../../src/runtime/assertAgentSdkPackaged.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("assertAgentSdkPackaged");

if (runThis) {
  describe("assertAgentSdkPackaged", () => {
    it("claude: throws naming @anthropic-ai/claude-agent-sdk and features.agentBackend when it does not resolve", () => {
      expect(() => assertAgentSdkPackaged("claude", { resolveSdkPath: () => undefined })).toThrow(
        /@anthropic-ai\/claude-agent-sdk[\s\S]*features\.agentBackend/,
      );
    });

    it("cursor: throws naming @cursor/sdk when the resolved path does not exist", () => {
      expect(() =>
        assertAgentSdkPackaged("cursor", { resolveSdkPath: () => "/missing/@cursor/sdk", existsSync: () => false }),
      ).toThrow(/@cursor\/sdk/);
    });

    it("resolves the SDK of the picked backend only", () => {
      const asked: string[] = [];
      assertAgentSdkPackaged("claude", {
        resolveSdkPath: (specifier) => {
          asked.push(specifier);
          return "/packaged/sdk";
        },
        existsSync: () => true,
      });
      expect(asked).toEqual(["@anthropic-ai/claude-agent-sdk"]);
    });

    it("none: never throws and resolves nothing", () => {
      const asked: string[] = [];
      expect(() =>
        assertAgentSdkPackaged("none", {
          resolveSdkPath: (specifier) => {
            asked.push(specifier);
            return undefined;
          },
        }),
      ).not.toThrow();
      expect(asked).toEqual([]);
    });
  });
}
