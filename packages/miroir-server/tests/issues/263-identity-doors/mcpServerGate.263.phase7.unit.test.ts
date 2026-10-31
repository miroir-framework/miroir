/**
 * #263 Slice 7: miroir-server passes one MCP gate (global hatch plus MCP switch) to both MCP
 * mounts, the dedicated listener and `/mcp` on the main app, and gates `/api/copilotkit` with the
 * shared identity middleware. The gate's behaviour is covered by gate.263 (miroir-core) and
 * mcpAuth.263 (miroir-mcp).
 * #636: the gates are built by miroir-server-library's factory; `/mcp` refusing a request without a
 * token on the factory's app is tested in miroir-server-library (serverApp.636.phase3). This file
 * keeps the switch resolution (binary) and the gate wiring (library).
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
// #636: the shared gate is built by miroir-server-library's factory, which the binary calls.
const LIBRARY_SOURCE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../../../miroir-server-library/src/createMiroirServerApp.ts"),
  "utf8",
);

if (runThis) {
  describe("mcpServerGate.263.phase7 server wiring", () => {
    it("resolves the MCP switch under the global hatch, from the server configuration", () => {
      expect(SERVER_SOURCE).toMatch(
        /resolveMcpAuthenticationEnabled\(\{[\s\S]*?config: \{ mcp: serverAuthentication\?\.mcp \}[\s\S]*?globalEnabled: authenticationEnabled/,
      );
      expect(SERVER_SOURCE).toMatch(/authentication: \{ enabled: authenticationEnabled, mcpEnabled: mcpAuthenticationEnabled \}/);
      expect(LIBRARY_SOURCE).toMatch(
        /const mcpAuthenticationGate: AuthenticationGate = \{ \.\.\.authenticationGate, enabled: options\.authentication\.mcpEnabled \}/,
      );
    });

    it("passes the MCP gate to the dedicated listener and to /mcp on the main app", () => {
      expect(LIBRARY_SOURCE).toMatch(/setupMcpServer\(\s*mcpApp,[\s\S]*?mcpAuthenticationGate,\s*\)/);
      expect(LIBRARY_SOURCE).toMatch(/mcpServer\.mountHttpRoutes\(app, mcpAuthenticationGate\)/);
    });

    it("gates /api/copilotkit with the shared identity middleware", () => {
      expect(LIBRARY_SOURCE).toMatch(/const identityGate = createIdentityGateMiddleware\(authenticationGate\)/);
      expect(LIBRARY_SOURCE).toContain("options.assistantRoute?.(app, { requestGate,");
      expect(SERVER_SOURCE).toMatch(/assistantRoute: async \(miroirApp, \{ requestGate \}\)/);
    });
  });
}
