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
const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

type MlSchemaObject = {
  type?: string;
  definition?: Record<string, { optional?: boolean; type?: string }>;
};

function getMlSchemaDefinition(
  entity: Record<string, unknown>
): Record<string, { optional?: boolean; type?: string }> {
  const mlSchema = entity.mlSchema as MlSchemaObject | undefined;
  expect(mlSchema?.type).toBe("object");
  expect(mlSchema?.definition).toBeTypeOf("object");
  return mlSchema!.definition!;
}

/**
 * Phase 1 — MiroirUser entity + seed users (#219).
 */
describe("miroirUserRights.219.phase1 — MiroirUser model and seed data", () => {
  const modelDir = getAdminModelDir();
  const dataDir = getAdminDataDir();

  it("has Entity named MiroirUser in admin_model", () => {
    const entity = findAdminEntityByName("MiroirUser", modelDir);
    expect(entity).toBeDefined();
    expect(entity?.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("MiroirUser mlSchema includes name, status; description optional", () => {
    const entity = findAdminEntityByName("MiroirUser", modelDir);
    expect(entity).toBeDefined();
    const definition = getMlSchemaDefinition(entity as Record<string, unknown>);

    expect(definition.name).toBeDefined();
    expect(definition.name.type).toBe("string");
    expect(definition.name.optional).not.toBe(true);

    expect(definition.status).toBeDefined();
    expect(definition.status.type).toBe("string");
    expect(definition.status.optional).not.toBe(true);

    expect(definition.description).toBeDefined();
    expect(definition.description.type).toBe("string");
    expect(definition.description.optional).toBe(true);

    // uuid comes from entityDefinitionRoot extend (not redeclared on the entity)
    expect(definition.uuid).toBeUndefined();
  });

  it("has a matching EntityVersion for MiroirUser", () => {
    const entity = findAdminEntityByName("MiroirUser", modelDir);
    expect(entity?.uuid).toBeTruthy();
    const versionDir = join(modelDir, ENTITY_VERSION_PARENT_UUID);
    const match = readdirSync(versionDir)
      .filter((n) => n.endsWith(".json"))
      .map((n) => readJsonInstance(join(versionDir, n)))
      .find((v) => v.entityUuid === entity!.uuid && v.name === "MiroirUser");
    expect(match).toBeDefined();
    const definition = getMlSchemaDefinition(match as Record<string, unknown>);
    expect(definition.name).toBeDefined();
    expect(definition.status).toBeDefined();
  });

  it("has at least two MiroirUser seed instances with active/inactive status", () => {
    const entity = findAdminEntityByName("MiroirUser", modelDir);
    expect(entity?.uuid).toBeTruthy();
    const files = listAdminDataInstanceFiles(entity!.uuid as string, dataDir);
    expect(files.length).toBeGreaterThanOrEqual(2);

    const instances = files.map(readJsonInstance);
    for (const instance of instances) {
      expect(instance.parentUuid).toBe(entity!.uuid);
      expect(instance.parentName).toBe("MiroirUser");
      expect(typeof instance.name).toBe("string");
      expect(["active", "inactive"]).toContain(instance.status);
    }
    const statuses = new Set(instances.map((i) => i.status));
    expect(statuses.has("active")).toBe(true);
    expect(statuses.has("inactive")).toBe(true);
  });

  it("package index.ts exports entityMiroirUser and seed MiroirUser instances", () => {
    const indexSource = readFileSync(join(PACKAGE_ROOT, "index.ts"), "utf8");
    expect(indexSource).toMatch(/export \{ default as entityMiroirUser \}/);
    expect(indexSource).toMatch(/export \{ default as entityVersionMiroirUser \}/);
    expect(indexSource).toMatch(/export \{ default as miroirUser_/);
  });
});
