/**
 * #275 Slice 0 — characterize today's CopilotKit backend / AI runtime contracts (no cursor yet).
 * Do not register in FunctionCallTestRegistry.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { createMiroirCopilotKitActions } from "miroir-ai";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase0";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const LENDING_ENDPOINT_UUID = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

function readPackageJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readRepoFile(relativePath)) as Record<string, unknown>;
}

function packageHasCursorSdkDependency(pkgJson: Record<string, unknown>): boolean {
  const sections = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
  for (const section of sections) {
    const deps = pkgJson[section] as Record<string, string> | undefined;
    if (deps && ("@cursor/sdk" in deps || "@cursor/sdk" in Object.values(deps))) {
      return true;
    }
    if (deps?.["@cursor/sdk"]) {
      return true;
    }
  }
  return false;
}

if (runThis) {
  describe("cursorSdk.275.phase0 — createMiroirCopilotKitActions live action names", () => {
    it("returns exactly lendDocument, generateMiroirReport, getMiroirContext", () => {
      const actions = createMiroirCopilotKitActions(undefined as any, undefined as any);
      expect(actions.map((action) => action.name).sort()).toEqual([
        "generateMiroirReport",
        "getMiroirContext",
        "lendDocument",
      ]);
    });
  });

  describe("cursorSdk.275.phase0 — miroirCopilotKitActions source pins", () => {
    it("uses lending endpoint uuid 212f2784-5b68-43b2-8ee0-89b1c6fdd0de", () => {
      const src = readRepoFile("packages/miroir-ai/src/tools/miroirCopilotKitActions.ts");
      expect(src).toContain(LENDING_ENDPOINT_UUID);
    });

    it("commented runtime tools exist as comments only", () => {
      const src = readRepoFile("packages/miroir-ai/src/tools/miroirCopilotKitActions.ts");
      expect(src).toContain("//   name: \"generateMiroirEntity\"");
      expect(src).toContain("//   name: \"generateMiroirQuery\"");
      expect(src).toContain("//   name: \"generateMiroirTransformer\"");
      expect(src).not.toMatch(/^\s*name:\s*"generateMiroirEntity"/m);
      expect(src).not.toMatch(/^\s*name:\s*"generateMiroirQuery"/m);
      expect(src).not.toMatch(/^\s*name:\s*"generateMiroirTransformer"/m);
    });
  });

  describe("cursorSdk.275.phase0 — AiProviderType is four token adapters", () => {
    it("copilotRuntimeFactory.ts AiProviderType is openai | anthropic | google | github", () => {
      const src = readRepoFile("packages/miroir-ai/src/runtime/copilotRuntimeFactory.ts");
      expect(src).toContain('export type AiProviderType = "openai" | "anthropic" | "google" | "github";');
    });
  });

  describe("cursorSdk.275.phase0 — copilotKitRoute resolveConfig", () => {
    it("resolveConfig reads body.aiConfig then env; no aiConfig.backend", () => {
      const src = readRepoFile("packages/miroir-ai/src/routes/copilotKitRoute.ts");
      expect(src).toContain("function resolveConfig(req: Request)");
      expect(src).toContain("body?.aiConfig");
      expect(src).toContain("getDefaultRuntimeConfig()");
      expect(src).not.toContain("aiConfig.backend");
    });
  });

  describe("cursorSdk.275.phase0 — server CopilotKit mount and auth gate", () => {
    // #409: the mount moved to mountCopilotKitRoute.ts, which imports miroir-ai on demand.
    // #263: the gate is the shared identity middleware (assertRequestAllowed inside authenticateRequest).
    it("server.ts mounts CopilotKit through mountCopilotKitRoute, gated with the identity middleware", () => {
      const src = readRepoFile("packages/miroir-server/src/server.ts");
      const mount = readRepoFile("packages/miroir-server/src/mountCopilotKitRoute.ts");
      expect(mount).toMatch(/=\s*\(\)\s*=>\s*import\([^)]*"miroir-ai"\)/);
      expect(mount).not.toMatch(/from\s*"miroir-ai"/);
      expect(mount).toContain("shouldMountCopilotKitRoute");
      expect(mount).toContain('app.use("/api/copilotkit", options.requestGate)');
      const mountCall = src.indexOf("await mountCopilotKitRoute(app");
      expect(mountCall).toBeGreaterThanOrEqual(0);
      expect(src.indexOf("createIdentityGateMiddleware(authenticationGate)", mountCall)).toBeGreaterThan(mountCall);
      expect(src).toContain("requestGate:");
    });
  });

  describe("cursorSdk.275.phase0 — Electron ipcServerSetup CopilotKit import", () => {
    // #370: imported when the `ai` feature mounts the route, so the main process does not read
    // miroir-ai at start otherwise.
    it("ipcServerSetup.ts imports createCopilotKitRouter from miroir-ai on demand", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app-electron/src/ipcServerSetup.ts",
      );
      expect(src).toMatch(/const\s*\{[^}]*\bcreateCopilotKitRouter\b[^}]*\}\s*=\s*await\s+import\("miroir-ai"\)/);
      expect(src).not.toMatch(/from\s*"miroir-ai"/);
    });
  });

  describe("cursorSdk.275.phase0 — @cursor/sdk lives on miroir-ai only", () => {
    it("miroir-ai lists @cursor/sdk; root / server / app / electron do not", () => {
      expect(packageHasCursorSdkDependency(readPackageJson("packages/miroir-ai/package.json"))).toBe(
        true,
      );
      const otherPackagePaths = [
        "package.json",
        "packages/miroir-server/package.json",
        "packages/miroir-standalone-app/package.json",
        "packages/miroir-standalone-app-electron/package.json",
      ];
      for (const path of otherPackagePaths) {
        expect(packageHasCursorSdkDependency(readPackageJson(path))).toBe(false);
      }
    });
  });

  // #263: /mcp takes the host's authentication gate (identity on the route, access per tool call).
  describe("cursorSdk.275.phase0 — MCP mountHttpRoutes takes an authentication gate", () => {
    it("mcpServer.ts mountHttpRoutes mounts the identity middleware when given a gate", () => {
      const src = readRepoFile("packages/miroir-mcp/src/mcpServer.ts");
      const mountStart = src.indexOf("mountHttpRoutes(targetApp: Express, authenticationGate?: AuthenticationGate)");
      expect(mountStart).toBeGreaterThanOrEqual(0);
      const mountEnd = src.indexOf("Start the MCP server with HTTP transport", mountStart);
      const mountBlock = src.slice(mountStart, mountEnd > mountStart ? mountEnd : undefined);
      expect(mountBlock).toContain("createIdentityGateMiddleware(authenticationGate)");
    });
  });
}
