/**
 * Agent backends (#409): a server configured with an agent backend whose SDK is missing (a Docker image
 * built for another AGENT_BACKEND) fails at start, before mounting the CopilotKit route.
 */
import { describe, expect, it } from "vitest";

import { mountCopilotKitRoute } from "../src/mountCopilotKitRoute.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("mountCopilotKitRoute");

function capabilities(agentBackend: "none" | "cursor" | "claude") {
  return {
    ai: true,
    mcp: true,
    agentBackend,
    designerTools: true,
    availableStoreTypes: [],
    creatableStoreTypes: [],
    storeAdministration: false,
  } as any;
}

function fakeMiroirAi(checked: string[]) {
  return async () =>
    ({
      createCopilotKitRouter: () => () => undefined,
      assertAgentSdkPackaged: (agentBackend: string) => {
        checked.push(agentBackend);
        if (agentBackend === "claude") {
          throw new Error("Agent SDK is not packaged: could not resolve @anthropic-ai/claude-agent-sdk");
        }
      },
    }) as any;
}

async function mount(agentBackend: "none" | "cursor" | "claude", checked: string[], mounted: string[]) {
  return mountCopilotKitRoute(
    { use: (path: string) => mounted.push(path) },
    {
      capabilities: capabilities(agentBackend),
      domainController: {} as any,
      applicationDeploymentMap: {},
      mcpHttpUrl: "http://127.0.0.1:1/mcp",
      importMiroirAi: fakeMiroirAi(checked),
    },
  );
}

if (runThis) {
  describe("mountCopilotKitRoute: start check of the picked agent SDK", () => {
    it("a missing SDK fails the mount and mounts nothing", async () => {
      const checked: string[] = [];
      const mounted: string[] = [];
      await expect(mount("claude", checked, mounted)).rejects.toThrow(/@anthropic-ai\/claude-agent-sdk/);
      expect(checked).toEqual(["claude"]);
      expect(mounted).toEqual([]);
    });

    it("a present SDK is checked, then the route is mounted", async () => {
      const checked: string[] = [];
      const mounted: string[] = [];
      expect(await mount("cursor", checked, mounted)).toBe(true);
      expect(checked).toEqual(["cursor"]);
      expect(mounted).toEqual(["/api/copilotkit"]);
    });

    it("none checks no SDK", async () => {
      const checked: string[] = [];
      expect(await mount("none", checked, [])).toBe(true);
      expect(checked).toEqual([]);
    });
  });
}
