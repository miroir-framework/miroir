/**
 * Agent backends (#409): the MCP URL given to the agent subprocess matches a listener that
 * speaks plain HTTP. With TLS on, the API port speaks HTTPS, so the agent goes to the dedicated
 * MCP listener (always plain HTTP) when one is configured.
 */
import { describe, expect, it } from "vitest";

import { agentMcpHttpUrl } from "../src/mountCopilotKitRoute.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("mountCopilotKitRoute");

if (runThis) {
  describe("mountCopilotKitRoute: agent MCP URL", () => {
    it("without TLS, uses /mcp on the API port", () => {
      expect(agentMcpHttpUrl({ restPort: 3080, mcpPort: 4080, tls: false })).toBe("http://127.0.0.1:3080/mcp");
    });

    it("with TLS, uses the dedicated plain-HTTP MCP listener", () => {
      expect(agentMcpHttpUrl({ restPort: 3080, mcpPort: 4080, tls: true })).toBe("http://127.0.0.1:4080/mcp");
    });

    it("with TLS and no dedicated MCP listener, uses https on the API port", () => {
      expect(agentMcpHttpUrl({ restPort: 3080, mcpPort: 0, tls: true })).toBe("https://127.0.0.1:3080/mcp");
    });
  });
}
