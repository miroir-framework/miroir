import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  findAdminEntityByName,
  getAdminDataDir,
  getAdminModelDir,
  listAdminDataInstanceFiles,
  listAdminDataParentUuids,
  readJsonInstance,
  type AdminJsonInstance,
} from "./helpers/adminAssetInventory";

const ADMIN_APPLICATION_ENTITY_UUID = "25d935e7-9e93-42c2-aade-0472b883492b";
const DEPLOYMENT_ENTITY_UUID = "7959d814-400c-4e80-988f-a00fe582ab98";
const REPORT_ENTITY_UUID = "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916";
const MENU_PATH =
  "dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(PACKAGE_ROOT, "../..");
const SANDBOX_BUNDLED_DATA = join(REPO_ROOT, "packages/miroir-sandbox/src/bundledData.ts");

const EXPECTED_REPORT_NAMES = [
  "MiroirUserList",
  "MiroirUserDetails",
  "MiroirRightList",
  "MiroirRightDetails",
] as const;

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

function listReports(modelDir: string): AdminJsonInstance[] {
  const reportDir = join(modelDir, REPORT_ENTITY_UUID);
  return readdirSync(reportDir)
    .filter((n) => n.endsWith(".json"))
    .map((n) => readJsonInstance(join(reportDir, n)));
}

function findReportByName(name: string, modelDir: string): AdminJsonInstance | undefined {
  return listReports(modelDir).find((r) => r.name === name);
}

function collectFilesRecursively(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      collectFilesRecursively(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      collectSourceFiles(full, acc);
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Extract string literals from ADMIN_MODEL_PARENT_UUIDS_ARRAY in sandbox bundledData.ts
 * without importing the module (avoids admin↔sandbox circular load).
 */
function readAdminModelParentUuidsFromSandboxSource(): string[] {
  const source = readFileSync(SANDBOX_BUNDLED_DATA, "utf8");
  const match = source.match(
    /export const ADMIN_MODEL_PARENT_UUIDS_ARRAY: string\[\] = \[([\s\S]*?)\];/
  );
  expect(match, "ADMIN_MODEL_PARENT_UUIDS_ARRAY not found in bundledData.ts").toBeTruthy();
  const body = match![1];
  return [...body.matchAll(/"([0-9a-f-]{36})"/gi)].map((m) => m[1]);
}

describe("MiroirUser model and seed data", () => {
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

  it("has present-model mlSchema on MiroirUser Entity (no separate EntityVersion row)", () => {
    const entity = findAdminEntityByName("MiroirUser", modelDir);
    expect(entity?.uuid).toBeTruthy();
    const definition = getMlSchemaDefinition(entity as Record<string, unknown>);
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
    expect(indexSource).not.toMatch(/export \{ default as entityVersionMiroirUser \}/);
    expect(indexSource).toMatch(/export \{ default as miroirUser_/);
  });
});

describe("MiroirRight model and seed data", () => {
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

describe("Admin reports and menu for MiroirUser / MiroirRight", () => {
  const modelDir = getAdminModelDir();

  it("has MiroirUser and MiroirRight list and detail reports", () => {
    for (const name of EXPECTED_REPORT_NAMES) {
      const report = findReportByName(name, modelDir);
      expect(report, `missing report ${name}`).toBeDefined();
      expect(report?.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(report?.parentUuid).toBe(REPORT_ENTITY_UUID);
    }
  });

  it("MiroirRight list/detail target MiroirRight and cover grant fields via entity viewAttributes", () => {
    const rightEntity = findAdminEntityByName("MiroirRight", modelDir);
    expect(rightEntity?.uuid).toBeTruthy();
    const viewAttributes = rightEntity?.viewAttributes as string[] | undefined;
    expect(viewAttributes).toEqual(
      expect.arrayContaining(["miroirUser", "capability", "targetType", "targetUuid"])
    );

    const list = findReportByName("MiroirRightList", modelDir) as Record<string, any>;
    const details = findReportByName("MiroirRightDetails", modelDir) as Record<string, any>;
    expect(list).toBeDefined();
    expect(details).toBeDefined();

    const listSection = list.definition?.section;
    expect(listSection?.type).toBe("objectListReportSection");
    expect(listSection?.definition?.parentUuid).toBe(rightEntity!.uuid);

    const detailSections = details.definition?.section?.definition;
    expect(Array.isArray(detailSections)).toBe(true);
    const instanceSection = detailSections.find(
      (s: any) => s.type === "objectInstanceReportSection"
    );
    expect(instanceSection?.definition?.parentUuid).toBe(rightEntity!.uuid);
  });

  it("AdminMenu references MiroirUserList and MiroirRightList reports", () => {
    const userList = findReportByName("MiroirUserList", modelDir);
    const rightList = findReportByName("MiroirRightList", modelDir);
    expect(userList?.uuid).toBeTruthy();
    expect(rightList?.uuid).toBeTruthy();

    const menu = readJsonInstance(join(modelDir, MENU_PATH)) as Record<string, any>;
    const items: any[] = menu.definition?.definition?.[0]?.items ?? [];
    const reportUuids = items
      .filter((i) => i.miroirMenuItemType === "miroirMenuReportLink")
      .map((i) => i.reportUuid);
    expect(reportUuids).toContain(userList!.uuid);
    expect(reportUuids).toContain(rightList!.uuid);
  });

  it("package index.ts exports the new reports", () => {
    const indexSource = readFileSync(join(PACKAGE_ROOT, "index.ts"), "utf8");
    expect(indexSource).toMatch(/export \{ default as reportMiroirUserList \}/);
    expect(indexSource).toMatch(/export \{ default as reportMiroirUserDetails \}/);
    expect(indexSource).toMatch(/export \{ default as reportMiroirRightList \}/);
    expect(indexSource).toMatch(/export \{ default as reportMiroirRightDetails \}/);
  });

  it("does not add dedicated MiroirUser/MiroirRight React CRUD form components", () => {
    const scanRoots = [
      join(REPO_ROOT, "packages/miroir-react/src"),
      join(REPO_ROOT, "packages/miroir-standalone-app/src"),
    ];
    const banned = /MiroirUser.*Form|MiroirRight.*Form|Form.*MiroirUser|Form.*MiroirRight/i;
    const hits: string[] = [];
    for (const root of scanRoots) {
      for (const file of collectFilesRecursively(root)) {
        if (!/\.(tsx?|jsx?)$/.test(file)) continue;
        if (banned.test(file)) hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });
});

// transitional guard — delete when #71 lands
describe("no MiroirRight runtime enforcement", () => {
  const ENFORCEMENT_PATTERN =
    /checkMiroirRight|authorizeMiroir|hasMiroirAccess|evaluateMiroirRight/;

  const SCAN_ROOTS = [
    join(REPO_ROOT, "packages/miroir-core/src"),
    join(REPO_ROOT, "packages/miroir-server/src"),
    join(REPO_ROOT, "packages/miroir-store-filesystem/src"),
    join(REPO_ROOT, "packages/miroir-store-indexedDb/src"),
    join(REPO_ROOT, "packages/miroir-store-postgres/src"),
    join(REPO_ROOT, "packages/miroir-store-mongodb/src"),
    join(REPO_ROOT, "packages/miroir-store-bundled/src"),
    join(REPO_ROOT, "packages/miroir-localcache-redux/src"),
    join(REPO_ROOT, "packages/miroir-localcache-zustand/src"),
  ];

  it("has no checkMiroirRight / authorizeMiroir / hasMiroirAccess / evaluateMiroirRight symbols in core/server/stores", () => {
    const hits: { file: string; match: string }[] = [];
    for (const root of SCAN_ROOTS) {
      for (const file of collectSourceFiles(root)) {
        const text = readFileSync(file, "utf8");
        const match = text.match(ENFORCEMENT_PATTERN);
        if (match) {
          hits.push({ file, match: match[0] });
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

describe("Admin bundled data classification", () => {
  const modelDir = getAdminModelDir();
  const dataDir = getAdminDataDir();

  it("does not list MiroirUser / MiroirRight entity uuids in ADMIN_MODEL_PARENT_UUIDS_ARRAY", () => {
    const user = findAdminEntityByName("MiroirUser", modelDir);
    const right = findAdminEntityByName("MiroirRight", modelDir);
    expect(user?.uuid).toBeTruthy();
    expect(right?.uuid).toBeTruthy();

    const modelParents = readAdminModelParentUuidsFromSandboxSource();
    expect(modelParents).not.toContain(user!.uuid);
    expect(modelParents).not.toContain(right!.uuid);

    // Same rule as existing Admin data entities
    expect(modelParents).not.toContain(ADMIN_APPLICATION_ENTITY_UUID);
    expect(modelParents).not.toContain(DEPLOYMENT_ENTITY_UUID);
  });

  it("places MiroirUser / MiroirRight seed instances under admin_data (data section)", () => {
    const user = findAdminEntityByName("MiroirUser", modelDir)!;
    const right = findAdminEntityByName("MiroirRight", modelDir)!;
    const dataParents = listAdminDataParentUuids(dataDir);

    expect(dataParents).toContain(user.uuid as string);
    expect(dataParents).toContain(right.uuid as string);
    expect(listAdminDataInstanceFiles(user.uuid as string, dataDir).length).toBeGreaterThanOrEqual(2);
    expect(listAdminDataInstanceFiles(right.uuid as string, dataDir).length).toBeGreaterThanOrEqual(2);
  });

  it("classifies seed parentUuids into data under the ADMIN_MODEL_PARENT_UUIDS rule", () => {
    const user = findAdminEntityByName("MiroirUser", modelDir)!;
    const right = findAdminEntityByName("MiroirRight", modelDir)!;
    const modelParents = new Set(readAdminModelParentUuidsFromSandboxSource());

    for (const parentUuid of [user.uuid as string, right.uuid as string]) {
      expect(modelParents.has(parentUuid)).toBe(false);
    }
  });
});
