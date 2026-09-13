/**
 * #273 Slice 0 — characterize today's process-capability / feature-switch contracts.
 * Slice 1 consumed the FeatureUnavailable pin; remaining characterizes still-current contracts.
 * authentication.71.phase0 still pins monoUserAutentification unread.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ADMIN_APPLICATION_UUID,
  ALWAYS_ALLOW_APPLICATION_TARGETS,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilities.273.phase0";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const CORE_SRC = join(REPO_ROOT, "packages/miroir-core/src");
const ADMIN_MODEL_ENTITIES = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
);
const ADMIN_DATA = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-admin/assets/admin_data",
);
const VIEW_PARAMS_ENTITY_UUID = "b9765b7c-b614-4126-a0e2-634463f99937";
const VIEW_PARAMS_SEED_UUID = "441cb6fd-2728-4a16-b170-ebceec1ce6c2";
const MIROIR_RIGHT_ENTITY_UUID = "a6136fc7-949b-4d64-9f13-dd3afce1ab3c";
const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const FORBIDDEN_RIGHT_UUID = "86a73f7e-17f8-462d-8203-af1f323a7cdc";

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

if (runThis) {
  describe("processCapabilities.273.phase0 — FeatureUnavailable is on ActionErrorType", () => {
    it("DomainElement.ts source contains FeatureUnavailable", () => {
      const src = readSource("0_interfaces/2_domain/DomainElement.ts");
      expect(src).toContain("FeatureUnavailable");
    });
  });

  describe("processCapabilities.273.phase0 — config schemas have no features key", () => {
    it("miroirConfigClient and miroirConfigServer Jzod schema blocks have no features property", () => {
      const src = readSource(
        "0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts",
      );
      const clientBlock = schemaBlock(src, "miroirConfigClient", "miroirConfigServer");
      const serverBlock = schemaBlock(src, "miroirConfigServer", "miroirConfig");
      expect(clientBlock).not.toMatch(/^\s+features\s*:/m);
      expect(serverBlock).not.toMatch(/^\s+features\s*:/m);
    });

    it("miroirConfig.server.json and miroirConfig.server.docker.json have no top-level features key", () => {
      const localConfig = readJson(
        join(REPO_ROOT, "packages/miroir-server/config/miroirConfig.server.json"),
      );
      const dockerConfig = readJson(
        join(REPO_ROOT, "packages/miroir-server/config/miroirConfig.server.docker.json"),
      );
      expect(localConfig).not.toHaveProperty("features");
      expect(dockerConfig).not.toHaveProperty("features");
    });
  });

  describe("processCapabilities.273.phase0 — ViewParams still documents agents", () => {
    it("ViewParams.ts source still contains agents", () => {
      const src = readSource("0_interfaces/4-views/ViewParams.ts");
      expect(src).toContain("agents");
    });

    it("Admin ViewParams entity mlSchema has agents", () => {
      const entity = readJson(
        join(ADMIN_MODEL_ENTITIES, `${VIEW_PARAMS_ENTITY_UUID}.json`),
      );
      const mlSchema = entity.mlSchema as { definition?: Record<string, unknown> };
      expect(mlSchema.definition).toHaveProperty("agents");
    });

    it("Default ViewParams seed has agents: false", () => {
      const seed = readJson(
        join(ADMIN_DATA, VIEW_PARAMS_ENTITY_UUID, `${VIEW_PARAMS_SEED_UUID}.json`),
      );
      expect(seed.agents).toBe(false);
    });
  });

  describe("processCapabilities.273.phase0 — getClientEnvironment detection order", () => {
    it("getClientEnvironment checks sandbox, then node, then electronAPI (source order)", () => {
      const src = readSource("tools.ts");
      const fnStart = src.indexOf("export const getClientEnvironment");
      const fnEnd = src.indexOf("export function getMiroirEnvironmentMode", fnStart);
      const fnBlock = src.slice(fnStart, fnEnd);
      const sandboxIdx = fnBlock.indexOf("MIROIR_IS_SANDBOX");
      const nodeIdx = fnBlock.indexOf("(process as any).versions?.node");
      const electronIdx = fnBlock.indexOf("electronAPI?.callMiroirIpc");
      expect(sandboxIdx).toBeGreaterThanOrEqual(0);
      expect(nodeIdx).toBeGreaterThan(sandboxIdx);
      expect(electronIdx).toBeGreaterThan(nodeIdx);
    });
  });

  describe("processCapabilities.273.phase0 — access policy always-allow targets", () => {
    it("ALWAYS_ALLOW_APPLICATION_TARGETS contains ADMIN_APPLICATION_UUID", () => {
      expect(
        ALWAYS_ALLOW_APPLICATION_TARGETS.some(
          (target) =>
            target.targetType === "application" &&
            target.targetUuid === ADMIN_APPLICATION_UUID,
        ),
      ).toBe(true);
    });
  });

  describe("processCapabilities.273.phase0 — Admin MiroirRight seed inventory", () => {
    it("no row grants Alice access to the Admin application target", () => {
      const rightDir = join(ADMIN_DATA, MIROIR_RIGHT_ENTITY_UUID);
      const rows = readdirSync(rightDir)
        .filter((name) => name.endsWith(".json"))
        .map((name) => readJson(join(rightDir, name)));
      const forbidden = rows.filter(
        (row) =>
          row.miroirUser === ALICE_UUID && row.targetUuid === ADMIN_APPLICATION_UUID,
      );
      expect(forbidden).toHaveLength(0);
      expect(existsSync(join(rightDir, `${FORBIDDEN_RIGHT_UUID}.json`))).toBe(false);
    });
  });

  describe("processCapabilities.273.phase0 — server mounts agents/MCP today", () => {
    it("server.ts source contains copilotkit route, mountHttpRoutes, and mcpServer.run", () => {
      const src = readFileSync(
        join(REPO_ROOT, "packages/miroir-server/src/server.ts"),
        "utf8",
      );
      expect(src).toContain('app.use("/api/copilotkit"');
      expect(src).toContain("mountHttpRoutes");
      expect(src).toContain("mcpServer.run");
    });
  });

  describe("processCapabilities.273.phase0 — Electron IPC has no agent servers", () => {
    it("ipcServerSetup.ts has no listen(, CopilotKit, or mcpServer", () => {
      const src = readFileSync(
        join(REPO_ROOT, "packages/miroir-standalone-app-electron/src/ipcServerSetup.ts"),
        "utf8",
      );
      expect(src).not.toMatch(/\blisten\s*\(/);
      expect(src).not.toContain("CopilotKit");
      expect(src).not.toContain("mcpServer");
    });
  });
}
