/**
 * #275 Slice 0 — characterize today's process-capability / AI config contracts (no cursor yet).
 * Do not register in FunctionCallTestRegistry.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  Action2Error,
  AI_SECRET_IMPORT_ALIASES,
  assertProcessCapability,
  FAIL_CLOSED_PROCESS_CAPABILITIES,
  getProcessCapabilities,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "cursorSdk.275" ||
  RUN_TEST.startsWith("cursorSdk.275") ||
  RUN_TEST === "cursorSdk.275.phase0";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const CORE_SRC = join(REPO_ROOT, "packages/miroir-core/src");

const emptyMap = new Map<string, unknown>();

const disabledSnapshot = {
  ai: false,
  mcp: false,
  cursor: false,
  designerTools: true,
  availableStoreTypes: [] as string[],
  creatableStoreTypes: [] as string[],
  storeAdministration: false,
};

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function readSource(relativePathFromCoreSrc: string): string {
  return readFileSync(join(CORE_SRC, relativePathFromCoreSrc), "utf8");
}

function schemaBlock(src: string, key: string, nextKey: string): string {
  const start = src.indexOf(`${key}: {`);
  const end = src.indexOf(`${nextKey}: {`, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
}

function featureDefinitionKeys(block: string): string[] {
  const featuresStart = block.indexOf("features:");
  expect(featuresStart).toBeGreaterThanOrEqual(0);
  const definitionStart = block.indexOf("definition:", featuresStart);
  expect(definitionStart).toBeGreaterThan(featuresStart);
  const definitionBlock = block.slice(definitionStart);
  const keys: string[] = [];
  for (const match of definitionBlock.matchAll(/^\s+(\w+)\s*:\s*\{/gm)) {
    keys.push(match[1]);
  }
  return keys;
}

if (runThis) {
  describe("cursorSdk.275.phase0 — FAIL_CLOSED_PROCESS_CAPABILITIES includes cursor", () => {
    it("exported fail-closed keys include cursor as false", () => {
      expect(Object.keys(FAIL_CLOSED_PROCESS_CAPABILITIES).sort()).toEqual([
        "ai",
        "availableStoreTypes",
        "creatableStoreTypes",
        "cursor",
        "designerTools",
        "mcp",
        "storeAdministration",
      ]);
      expect(FAIL_CLOSED_PROCESS_CAPABILITIES.cursor).toBe(false);
    });
  });

  describe("cursorSdk.275.phase0 — getProcessCapabilities includes cursor", () => {
    it("empty config on node yields snapshot with cursor false", () => {
      const snapshot = getProcessCapabilities({
        config: {},
        environment: "node",
        storeSectionFactoryRegister: emptyMap,
        adminStoreFactoryRegister: emptyMap,
      });
      expect(snapshot.cursor).toBe(false);
      expect(Object.keys(snapshot).sort()).toEqual([
        "ai",
        "availableStoreTypes",
        "creatableStoreTypes",
        "cursor",
        "designerTools",
        "mcp",
        "storeAdministration",
      ]);
    });
  });

  describe("cursorSdk.275.phase0 — ProcessCapabilityName union contains cursor", () => {
    it("processCapabilities.ts ProcessCapabilityName lists ai, mcp, cursor, storeAdministration, availableStoreTypes, designerTools", () => {
      const src = readSource("1_core/processCapabilities.ts");
      const unionStart = src.indexOf("export type ProcessCapabilityName");
      expect(unionStart).toBeGreaterThanOrEqual(0);
      const unionBlock = src.slice(unionStart, src.indexOf("type ProcessCapabilitiesConfig", unionStart));
      expect(unionBlock).toContain('"ai"');
      expect(unionBlock).toContain('"mcp"');
      expect(unionBlock).toContain('"cursor"');
      expect(unionBlock).toContain('"storeAdministration"');
      expect(unionBlock).toContain('"availableStoreTypes"');
      expect(unionBlock).toContain('"designerTools"');
    });
  });

  describe("cursorSdk.275.phase0 — Jzod features blocks include cursor", () => {
    it("miroirConfigClient and miroirConfigServer features.definition keys", () => {
      const src = readSource(
        "0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts",
      );
      const clientBlock = schemaBlock(src, "miroirConfigClient", "miroirConfigServer");
      const serverBlock = schemaBlock(src, "miroirConfigServer", "miroirConfig");
      expect(featureDefinitionKeys(clientBlock).sort()).toEqual([
        "ai",
        "cursor",
        "designerTools",
        "mcp",
      ]);
      expect(featureDefinitionKeys(serverBlock).sort()).toEqual([
        "ai",
        "cursor",
        "designerTools",
        "mcp",
      ]);
    });
  });

  describe("cursorSdk.275.phase0 — AI_SECRET_IMPORT_ALIASES includes cursor import alias", () => {
    it("openai, anthropic, google, github, and cursor (import-only)", () => {
      expect(Object.keys(AI_SECRET_IMPORT_ALIASES).sort()).toEqual([
        "anthropic",
        "cursor",
        "github",
        "google",
        "openai",
      ]);
    });
  });

  describe("cursorSdk.275.phase0 — assertProcessCapability refuses mcp when false", () => {
    it("returns Action2Error FeatureUnavailable with capability mcp", () => {
      const result = assertProcessCapability("mcp", disabledSnapshot);
      expect(result).toBeInstanceOf(Action2Error);
      expect(result).toMatchObject({
        status: "error",
        errorType: "FeatureUnavailable",
        errorContext: { capability: "mcp" },
      });
    });
  });

  describe("cursorSdk.275.phase0 — shipped server JSON features", () => {
    it("miroirConfig.server.json has features.ai and features.mcp, no cursor key", () => {
      const localConfig = readJson(
        join(REPO_ROOT, "packages/miroir-server/config/miroirConfig.server.json"),
      );
      const dockerConfig = readJson(
        join(REPO_ROOT, "packages/miroir-server/config/miroirConfig.server.docker.json"),
      );
      const features = localConfig.features as Record<string, unknown>;
      expect(features).toBeDefined();
      expect(features.ai).toBe(true);
      expect(features.mcp).toBe(true);
      expect(localConfig.features).not.toHaveProperty("cursor");
      expect(dockerConfig.features).not.toHaveProperty("cursor");
    });
  });
}
