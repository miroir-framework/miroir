import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  findAdminEntityByName,
  getAdminDataDir,
  getAdminModelDir,
  listAdminDataInstanceFiles,
  listAdminDataParentUuids,
} from "./helpers/adminAssetInventory";

const ADMIN_APPLICATION_ENTITY_UUID = "25d935e7-9e93-42c2-aade-0472b883492b";
const DEPLOYMENT_ENTITY_UUID = "7959d814-400c-4e80-988f-a00fe582ab98";

const SANDBOX_BUNDLED_DATA = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../miroir-sandbox/src/bundledData.ts"
);

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

/**
 * Phase 5 — bundled Admin classification (#219 / C6).
 * MiroirUser / MiroirRight instances are Admin *data* (like Application / Deployment),
 * not model-section parents in ADMIN_MODEL_PARENT_UUIDS_ARRAY.
 */
describe("miroirUserRights.219.phase5 — Admin bundled data classification", () => {
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
