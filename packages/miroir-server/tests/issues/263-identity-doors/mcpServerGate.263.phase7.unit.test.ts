/**
 * #263 Slice 7: miroir-server passes one MCP gate (global hatch plus MCP switch) to both MCP
 * mounts, the dedicated listener and `/mcp` on the main app, and gates `/api/copilotkit` with the
 * shared identity middleware. `server.ts` is a top-level-await script that cannot start in a test,
 * so this pins its wiring in the source; the gate's behaviour is covered by gate.263 (miroir-core)
 * and mcpAuth.263 (miroir-mcp).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("mcpServerGate.263");

const SERVER_SOURCE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../../src/server.ts"),
  "utf8",
);

if (runThis) {
  describe("mcpServerGate.263.phase7 server wiring", () => {
    it("resolves the MCP switch under the global hatch, from the server configuration", () => {
      expect(SERVER_SOURCE).toMatch(
        /resolveMcpAuthenticationEnabled\(\{[\s\S]*?config: \{ mcp: serverAuthentication\?\.mcp \}[\s\S]*?globalEnabled: authenticationEnabled/,
      );
      expect(SERVER_SOURCE).toMatch(
        /const mcpAuthenticationGate: AuthenticationGate = \{ \.\.\.authenticationGate, enabled: mcpAuthenticationEnabled \}/,
      );
    });

    it("passes the MCP gate to the dedicated listener and to /mcp on the main app", () => {
      expect(SERVER_SOURCE).toMatch(/setupMcpServer\(\s*mcpApp,[\s\S]*?mcpAuthenticationGate,\s*\)/);
      expect(SERVER_SOURCE).toMatch(/mcpServer\.mountHttpRoutes\(app, mcpAuthenticationGate\)/);
    });

    it("gates /api/copilotkit with the shared identity middleware", () => {
      expect(SERVER_SOURCE).toMatch(/requestGate: createIdentityGateMiddleware\(authenticationGate\)/);
    });
  });
}
