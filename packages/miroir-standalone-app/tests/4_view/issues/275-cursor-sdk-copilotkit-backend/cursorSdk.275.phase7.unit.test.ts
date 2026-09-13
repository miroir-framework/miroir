/**
 * #275 Slice 7 — Electron dummy cwd + fail-loud Cursor SDK packaging.
 * Do not register in FunctionCallTestRegistry.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase7";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

function readJson(...relativeParts: string[]): Record<string, unknown> {
  return JSON.parse(readRepoFile(...relativeParts)) as Record<string, unknown>;
}

function electronServerConfigBlock(src: string): string {
  const start = src.indexOf("const electronServerConfig");
  expect(start).toBeGreaterThanOrEqual(0);
  const end = src.indexOf("const miroirContext", start);
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
}

function electronMiroirConfigBlock(src: string): string {
  const start = src.indexOf("const electronMiroirConfig");
  expect(start).toBeGreaterThanOrEqual(0);
  const end = src.indexOf("const miroirConfigToUse", start);
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
}

function createCopilotKitRouterCall(src: string): string {
  const start = src.indexOf("createCopilotKitRouter(");
  expect(start).toBeGreaterThanOrEqual(0);
  return src.slice(start, start + 500);
}

function electronBuilderPackagingText(pkg: Record<string, unknown>): string {
  const build = (pkg.build ?? {}) as Record<string, unknown>;
  return JSON.stringify({
    files: build.files ?? [],
    asarUnpack: build.asarUnpack ?? [],
    extraResources: build.extraResources ?? [],
  });
}

if (runThis) {
  describe("cursorSdk.275.phase7 — no static @cursor/sdk import on Electron main", () => {
    it("ipcServerSetup.ts has no import \"@cursor/sdk\" and no from \"@cursor/sdk\"", () => {
      const src = readRepoFile("packages/miroir-standalone-app-electron/src/ipcServerSetup.ts");
      expect(src).not.toContain('import "@cursor/sdk"');
      expect(src).not.toContain('from "@cursor/sdk"');
    });

    it("main.ts has no import \"@cursor/sdk\" and no from \"@cursor/sdk\"", () => {
      const src = readRepoFile("packages/miroir-standalone-app-electron/src/main.ts");
      expect(src).not.toContain('import "@cursor/sdk"');
      expect(src).not.toContain('from "@cursor/sdk"');
    });
  });

  describe("cursorSdk.275.phase7 — dummy cwd is not the filesystem deployment root", () => {
    it("cursorAgent.ts uses createCursorDummyCwd under tmpdir/.miroir-cursor-cwd", () => {
      const src = readRepoFile("packages/miroir-ai/src/runtime/cursorAgent.ts");
      expect(src).toContain("createCursorDummyCwd");
      expect(src).toContain(".miroir-cursor-cwd");
      expect(src).toMatch(/\btmpdir\s*\(/);
      expect(src).toMatch(/const cwd = createCursorDummyCwd/);
      expect(src).not.toContain("getDefaultFilesystemFolder");
    });

    it("ipcServerSetup.ts does not pass getDefaultFilesystemFolder as Cursor cwd", () => {
      const src = readRepoFile("packages/miroir-standalone-app-electron/src/ipcServerSetup.ts");
      const routerCall = createCopilotKitRouterCall(src);
      expect(routerCall).not.toContain("getDefaultFilesystemFolder");
      expect(routerCall).not.toMatch(/\bcwd\s*:/);
      expect(routerCall).not.toContain("filesystemDeploymentRootDirectory");
    });
  });

  describe("cursorSdk.275.phase7 — fail-loud packaging path", () => {
    it("electron-builder files/asarUnpack/extraResources do not include a @cursor/sdk glob", () => {
      const pkg = readJson("packages/miroir-standalone-app-electron/package.json");
      expect(electronBuilderPackagingText(pkg)).not.toMatch(/@cursor\/sdk/);
    });

    it("assertCursorSdkPackaged is referenced from main.ts or ipcServerSetup.ts", () => {
      const ipcSrc = readRepoFile("packages/miroir-standalone-app-electron/src/ipcServerSetup.ts");
      const mainSrc = readRepoFile("packages/miroir-standalone-app-electron/src/main.ts");
      expect(ipcSrc.includes("assertCursorSdkPackaged") || mainSrc.includes("assertCursorSdkPackaged")).toBe(
        true,
      );
    });

    it("assertCursorSdkPackaged throws when the SDK path is missing", async () => {
      const helperHref = pathToFileURL(
        join(REPO_ROOT, "packages/miroir-ai/src/runtime/assertCursorSdkPackaged.ts"),
      ).href;
      const { assertCursorSdkPackaged } = await import(helperHref);
      expect(() =>
        assertCursorSdkPackaged({
          resolveSdkPath: () => "/missing/@cursor/sdk",
          existsSync: () => false,
        }),
      ).toThrow(/not packaged|@cursor\/sdk/i);
    });
  });

  describe("cursorSdk.275.phase7 — features.cursor stays persistence-side and off", () => {
    it("electronServerConfig has ai/mcp/designerTools and no cursor key", () => {
      const src = readRepoFile("packages/miroir-standalone-app-electron/src/ipcServerSetup.ts");
      const block = electronServerConfigBlock(src);
      expect(block).toMatch(/\bfeatures\s*:/);
      expect(block).toMatch(/\bai\s*:\s*true\b/);
      expect(block).toMatch(/\bmcp\s*:\s*true\b/);
      expect(block).toMatch(/\bdesignerTools\s*:\s*true\b/);
      expect(block).not.toMatch(/\bcursor\s*:/);
    });

    it("renderer electronMiroirConfig has no features key", () => {
      const src = readRepoFile("packages/miroir-standalone-app/src/index.tsx");
      expect(electronMiroirConfigBlock(src)).not.toMatch(/\bfeatures\b/);
    });
  });
}
