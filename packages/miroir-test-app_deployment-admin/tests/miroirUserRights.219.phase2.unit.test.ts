import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  findAdminEntityByName,
  getAdminDataDir,
  getAdminModelDir,
  listAdminDataInstanceFiles,
  readJsonInstance,
} from "./helpers/adminAssetInventory";

const ENTITY_VERSION_PARENT_UUID = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
const ADMIN_APPLICATION_ENTITY_UUID = "25d935e7-9e93-42c2-aade-0472b883492b";
const DEPLOYMENT_ENTITY_UUID = "7959d814-400c-4e80-988f-a00fe582ab98";
const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

type MlField = {
  optional?: boolean;
  type?: string;
  definition?: unknown;
  tag?: { value?: { foreignKeyParams?: { targetEntity?: string } } };
};

type MlSchemaObject = {
  type?: string;
  definition?: Record<string, MlField>;
};

function getMlSchemaDefinition(entity: Record<string, unknown>): Record<string, MlField> {
  const mlSchema = entity.mlSchema as MlSchemaObject | undefined;
  expect(mlSchema?.type).toBe("object");
  expect(mlSchema?.definition).toBeTypeOf("object");
  return mlSchema!.definition!;
}

function listKnownInstanceUuids(entityUuid: string, dataDir: string): Set<string> {
  return new Set(
    listAdminDataInstanceFiles(entityUuid, dataDir)
      .map(readJsonInstance)
      .map((i) => i.uuid)
      .filter((u): u is string => typeof u === "string")
  );
}

/**
 * Phase 2 — MiroirRight entity + seed grants (#219).
 */
describe("miroirUserRights.219.phase2 — MiroirRight model and seed data", () => {
  const modelDir = getAdminModelDir();
  const dataDir = getAdminDataDir();

  it("has Entity named MiroirRight in admin_model", () => {
    const entity = findAdminEntityByName("MiroirRight", modelDir);
    expect(entity).toBeDefined();
    expect(entity?.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("MiroirRight mlSchema has miroirUser, targetType, targetUuid, capability; description optional", () => {
    const entity = findAdminEntityByName("MiroirRight", modelDir);
    expect(entity).toBeDefined();
    const definition = getMlSchemaDefinition(entity as Record<string, unknown>);

    expect(definition.miroirUser).toBeDefined();
    expect(definition.miroirUser.type).toBe("uuid");
    expect(definition.miroirUser.optional).not.toBe(true);
    expect(definition.miroirUser.tag?.value?.foreignKeyParams?.targetEntity).toBe(
      findAdminEntityByName("MiroirUser", modelDir)?.uuid
    );

    expect(definition.targetType).toBeDefined();
    expect(definition.targetType.optional).not.toBe(true);
    if (definition.targetType.type === "enum") {
      expect(definition.targetType.definition).toEqual(["application", "deployment"]);
    } else {
      expect(definition.targetType.type).toBe("string");
    }

    expect(definition.targetUuid).toBeDefined();
    expect(definition.targetUuid.type).toBe("uuid");
    expect(definition.targetUuid.optional).not.toBe(true);

    expect(definition.capability).toBeDefined();
    expect(definition.capability.type).toBe("string");
    expect(definition.capability.optional).not.toBe(true);

    expect(definition.description).toBeDefined();
    expect(definition.description.type).toBe("string");
    expect(definition.description.optional).toBe(true);

    expect(definition.uuid).toBeUndefined();
  });

  it("has present-model mlSchema on MiroirRight Entity (no separate EntityVersion row)", () => {
    const entity = findAdminEntityByName("MiroirRight", modelDir);
    expect(entity?.uuid).toBeTruthy();
    const definition = getMlSchemaDefinition(entity as Record<string, unknown>);
    expect(definition.miroirUser).toBeDefined();
    expect(definition.targetType).toBeDefined();
    expect(definition.targetUuid).toBeDefined();
    expect(definition.capability).toBeDefined();
  });

  it("has seed rights for application and deployment scopes with valid references", () => {
    const rightEntity = findAdminEntityByName("MiroirRight", modelDir);
    const userEntity = findAdminEntityByName("MiroirUser", modelDir);
    expect(rightEntity?.uuid).toBeTruthy();
    expect(userEntity?.uuid).toBeTruthy();

    const userUuids = listKnownInstanceUuids(userEntity!.uuid as string, dataDir);
    const applicationUuids = listKnownInstanceUuids(ADMIN_APPLICATION_ENTITY_UUID, dataDir);
    const deploymentUuids = listKnownInstanceUuids(DEPLOYMENT_ENTITY_UUID, dataDir);

    const rights = listAdminDataInstanceFiles(rightEntity!.uuid as string, dataDir).map(
      readJsonInstance
    );
    expect(rights.length).toBeGreaterThanOrEqual(2);

    for (const right of rights) {
      expect(right.parentUuid).toBe(rightEntity!.uuid);
      expect(right.parentName).toBe("MiroirRight");
      expect(userUuids.has(right.miroirUser as string)).toBe(true);
      expect(typeof right.capability).toBe("string");
      expect((right.capability as string).length).toBeGreaterThan(0);
      expect(["application", "deployment"]).toContain(right.targetType);
      if (right.targetType === "application") {
        expect(applicationUuids.has(right.targetUuid as string)).toBe(true);
      } else {
        expect(deploymentUuids.has(right.targetUuid as string)).toBe(true);
      }
    }

    expect(rights.some((r) => r.targetType === "application")).toBe(true);
    expect(rights.some((r) => r.targetType === "deployment")).toBe(true);
  });

  it("package index.ts exports entityMiroirRight and seed MiroirRight instances", () => {
    const indexSource = readFileSync(join(PACKAGE_ROOT, "index.ts"), "utf8");
    expect(indexSource).toMatch(/export \{ default as entityMiroirRight \}/);
    expect(indexSource).not.toMatch(/export \{ default as entityVersionMiroirRight \}/);
    expect(indexSource).toMatch(/export \{ default as miroirRight_/);
  });
});
