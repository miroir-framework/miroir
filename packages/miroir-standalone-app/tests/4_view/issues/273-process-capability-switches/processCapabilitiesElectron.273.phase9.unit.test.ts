/**
 * #273 Slice 9 — Electron loopback listen + renderer URL helpers.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  browserMcpServerUrl,
  copilotRuntimeUrl,
  electronRuntimeBaseUrl,
  isAllowedElectronLoopbackOrigin,
  shouldListenLoopbackHttp,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilitiesElectron.273.phase9" ||
  RUN_TEST.startsWith("processCapabilitiesElectron.273");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

function readJson(...relativeParts: string[]): Record<string, unknown> {
  return JSON.parse(readRepoFile(...relativeParts)) as Record<string, unknown>;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

const LOOPBACK_BASE_RE = /^https?:\/\/(127\.0\.0\.1|localhost):\d+/;

if (runThis) {
  describe("processCapabilitiesElectron.273.phase9 — electronRuntimeBaseUrl", () => {
    it("derives a loopback http(s) URL from rootApiUrl and never returns app://", () => {
      const fromHttpsLocalhost = electronRuntimeBaseUrl({
        rootApiUrl: "https://localhost:3080",
      });
      expect(fromHttpsLocalhost).toMatch(LOOPBACK_BASE_RE);
      expect(fromHttpsLocalhost).not.toContain("app://");

      const fromHttpLoopback = electronRuntimeBaseUrl({
        rootApiUrl: "http://127.0.0.1:3080",
      });
      expect(fromHttpLoopback).toMatch(LOOPBACK_BASE_RE);
      expect(fromHttpLoopback).not.toContain("app://");
    });
  });

  describe("processCapabilitiesElectron.273.phase9 — copilotRuntimeUrl", () => {
    it("is absolute on electron and relative on web (Vite proxy)", () => {
      expect(normalizeUrl(copilotRuntimeUrl("electron", "http://127.0.0.1:3080"))).toBe(
        "http://127.0.0.1:3080/api/copilotkit",
      );
      expect(normalizeUrl(copilotRuntimeUrl("electron", "http://127.0.0.1:3080/"))).toBe(
        "http://127.0.0.1:3080/api/copilotkit",
      );
      expect(copilotRuntimeUrl("web", "http://127.0.0.1:3080")).toBe("/api/copilotkit");
    });
  });

  describe("processCapabilitiesElectron.273.phase9 — browserMcpServerUrl", () => {
    it("uses the loopback origin on electron (no /mcp suffix)", () => {
      expect(browserMcpServerUrl("electron", "http://127.0.0.1:3080")).toBe(
        "http://127.0.0.1:3080",
      );
    });
  });

  describe("processCapabilitiesElectron.273.phase9 — shouldListenLoopbackHttp", () => {
    it("is false when both flags are false and true if either flag is true", () => {
      expect(shouldListenLoopbackHttp({ ai: false, mcp: false })).toBe(false);
      expect(shouldListenLoopbackHttp({ ai: true, mcp: false })).toBe(true);
      expect(shouldListenLoopbackHttp({ ai: false, mcp: true })).toBe(true);
      expect(shouldListenLoopbackHttp({ ai: true, mcp: true })).toBe(true);
    });
  });

  describe("processCapabilitiesElectron.273.phase9 — Electron main listen is gated", () => {
    it("ipcServerSetup.ts contains shouldListenLoopbackHttp and listen", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app-electron/src/ipcServerSetup.ts",
      );
      expect(src).toContain("shouldListenLoopbackHttp");
      expect(src).toMatch(/\blisten\s*\(/);
    });

    it("electronServerConfig has features ai, mcp, and designerTools true", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app-electron/src/ipcServerSetup.ts",
      );
      const start = src.indexOf("const electronServerConfig");
      expect(start).toBeGreaterThanOrEqual(0);
      const block = src.slice(start, src.indexOf("const miroirContext", start));
      expect(block).toMatch(/\bfeatures\s*:/);
      expect(block).toMatch(/\bai\s*:\s*true\b/);
      expect(block).toMatch(/\bmcp\s*:\s*true\b/);
      expect(block).toMatch(/\bdesignerTools\s*:\s*true\b/);
    });
  });

  describe("processCapabilitiesElectron.273.phase9 — renderer electronMiroirConfig has no features", () => {
    it("index.tsx electronMiroirConfig has no features key", () => {
      const src = readRepoFile("packages/miroir-standalone-app/src/index.tsx");
      const start = src.indexOf("const electronMiroirConfig");
      expect(start).toBeGreaterThanOrEqual(0);
      const end = src.indexOf("const miroirConfigToUse", start);
      expect(end).toBeGreaterThan(start);
      const block = src.slice(start, end);
      expect(block).not.toMatch(/\bfeatures\b/);
    });
  });

  describe("processCapabilitiesElectron.273.phase9 — shipped server JSON still has ai/mcp", () => {
    it("miroirConfig.server.json and .docker.json keep features.ai and features.mcp true", () => {
      const localConfig = readJson("packages/miroir-server/config/miroirConfig.server.json");
      const dockerConfig = readJson(
        "packages/miroir-server/config/miroirConfig.server.docker.json",
      );
      const localFeatures = localConfig.features as { ai?: boolean; mcp?: boolean };
      const dockerFeatures = dockerConfig.features as { ai?: boolean; mcp?: boolean };
      expect(localFeatures.ai).toBe(true);
      expect(localFeatures.mcp).toBe(true);
      expect(dockerFeatures.ai).toBe(true);
      expect(dockerFeatures.mcp).toBe(true);
    });
  });

  describe("processCapabilitiesElectron.273.phase9 — loopback CORS allowlist", () => {
    it("allows packaged, Vite, and loopback origins and rejects arbitrary sites", () => {
      expect(isAllowedElectronLoopbackOrigin("null")).toBe(true);
      expect(isAllowedElectronLoopbackOrigin("file://")).toBe(true);
      expect(isAllowedElectronLoopbackOrigin("app://.")).toBe(true);
      expect(isAllowedElectronLoopbackOrigin("http://localhost:5173")).toBe(true);
      expect(isAllowedElectronLoopbackOrigin("https://127.0.0.1:3080")).toBe(true);
      expect(isAllowedElectronLoopbackOrigin("https://evil.example")).toBe(false);
      expect(isAllowedElectronLoopbackOrigin("http://192.168.1.10:3080")).toBe(false);
    });

    it("ipcServerSetup uses the allowlist and does not reflect every Origin", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app-electron/src/ipcServerSetup.ts",
      );
      expect(src).toContain("isAllowedElectronLoopbackOrigin");
      expect(src).toContain("domainController.setProcessCapabilities(capabilities)");
      expect(src).not.toMatch(
        /setHeader\(\s*["']Access-Control-Allow-Origin["']\s*,\s*origin\s*\)/,
      );
    });
  });

  describe("processCapabilitiesElectron.273.phase9 — AgentsCopilotKit uses copilotRuntimeUrl", () => {
    it("AgentsCopilotKit.tsx uses copilotRuntimeUrl instead of only a hard-coded relative runtimeUrl", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx",
      );
      expect(src).toContain("copilotRuntimeUrl");
      expect(src).not.toMatch(/runtimeUrl\s*=\s*["']\/api\/copilotkit["']/);
    });
  });
}
