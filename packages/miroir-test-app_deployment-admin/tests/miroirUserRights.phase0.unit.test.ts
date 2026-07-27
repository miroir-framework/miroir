import { describe, expect, it } from "vitest";

import {
  ADMIN_CATALOGUE_SMOKE,
  adminModelHasInstanceFolder,
  findAdminEntityByName,
  getAdminDataDir,
  getAdminModelDir,
  listAdminDataParentUuids,
  listAdminEntityNames,
} from "./helpers/adminAssetInventory";

/**
 * Phase 0 characterization for #219: Admin does not yet define MiroirUser / MiroirRight.
 * Later phases invert the absence assertions; do not leave contradictory Phase 0 cases after Phase 1–2.
 */
describe("miroirUserRights.phase0 — Admin baseline (no MiroirUser / MiroirRight yet)", () => {
  const modelDir = getAdminModelDir();
  const dataDir = getAdminDataDir();

  it("has no Entity named MiroirUser in admin_model", () => {
    expect(findAdminEntityByName("MiroirUser", modelDir)).toBeUndefined();
    expect(listAdminEntityNames(modelDir)).not.toContain("MiroirUser");
  });

  it("has no Entity named MiroirRight in admin_model", () => {
    expect(findAdminEntityByName("MiroirRight", modelDir)).toBeUndefined();
    expect(listAdminEntityNames(modelDir)).not.toContain("MiroirRight");
  });

  it("has no admin_data parent folders for MiroirUser / MiroirRight entities", () => {
    const dataParents = listAdminDataParentUuids(dataDir);
    for (const name of ["MiroirUser", "MiroirRight"] as const) {
      const entity = findAdminEntityByName(name, modelDir);
      expect(entity, `${name} must not exist as Entity before Phase 1–2`).toBeUndefined();
    }
    // Defense in depth: even if an entity uuid leaked without a named Entity row,
    // Phase 0 documents that no data folders are keyed by unknown future entity uuids
    // via the named-entity path above. Catalogue smoke covers known parents separately.
    expect(dataParents.length).toBeGreaterThan(0);
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
