import { describe, expect, it } from "vitest";

import {
  ADMIN_CATALOGUE_SMOKE,
  adminModelHasInstanceFolder,
  findAdminEntityByName,
  getAdminDataDir,
  getAdminModelDir,
  listAdminDataInstanceFiles,
  listAdminDataParentUuids,
  listAdminEntityNames,
} from "../../helpers/adminAssetInventory";

/**
 * Phase 0 characterization for #219 (updated through Phase 2).
 * MiroirUser / MiroirRight presence asserted here after Phases 1–2.
 */
describe("miroirUserRights.219.phase0 — Admin baseline catalogue", () => {
  const modelDir = getAdminModelDir();
  const dataDir = getAdminDataDir();

  it("has MiroirUser Entity after Phase 1", () => {
    expect(findAdminEntityByName("MiroirUser", modelDir)).toBeDefined();
    expect(listAdminEntityNames(modelDir)).toContain("MiroirUser");
    const entity = findAdminEntityByName("MiroirUser", modelDir)!;
    expect(listAdminDataParentUuids(dataDir)).toContain(entity.uuid as string);
    expect(listAdminDataInstanceFiles(entity.uuid as string, dataDir).length).toBeGreaterThanOrEqual(2);
  });

  it("has MiroirRight Entity after Phase 2", () => {
    expect(findAdminEntityByName("MiroirRight", modelDir)).toBeDefined();
    expect(listAdminEntityNames(modelDir)).toContain("MiroirRight");
    const entity = findAdminEntityByName("MiroirRight", modelDir)!;
    expect(listAdminDataParentUuids(dataDir)).toContain(entity.uuid as string);
    expect(listAdminDataInstanceFiles(entity.uuid as string, dataDir).length).toBeGreaterThanOrEqual(2);
  });

  it("still has AdminApplication and Deployment Entity definitions", () => {
    for (const name of ADMIN_CATALOGUE_SMOKE.entityNames) {
      const entity = findAdminEntityByName(name, modelDir);
      expect(entity, `missing Entity ${name}`).toBeDefined();
      expect(entity?.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    }
  });

  it("still has Report and Menu instance folders in admin_model", () => {
    for (const [label, uuid] of Object.entries(ADMIN_CATALOGUE_SMOKE.modelInstanceFolders)) {
      expect(
        adminModelHasInstanceFolder(uuid, modelDir),
        `missing admin_model instance folder for ${label} (${uuid})`
      ).toBe(true);
    }
  });
});
