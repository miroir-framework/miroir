/**
 * #220 — createEntity Entity-only (no entityVersion param).
 * Slice 1 of createEntity-remove-entityVersion-tdd-plan.md
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");

describe("220 createEntity Entity-only — Slice 1 store interface + Postgres", () => {
  it("PersistenceStoreEntitySectionAbstractInterface createEntity takes Entity only", () => {
    const iface = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerInterface.ts",
      ),
      "utf8",
    );
    expect(iface).toMatch(
      /createEntity\(\s*entity\s*:\s*Entity\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
    expect(iface).not.toMatch(
      /createEntity\(\s*entity\s*:\s*Entity\s*,\s*entityVersion\?/,
    );
    expect(iface).toMatch(
      /createEntities\(\s*entities\s*:\s*Entity\[\]\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
    expect(iface).not.toMatch(
      /createEntities\(\s*entities\s*:\s*\{\s*entity\s*:\s*Entity\s*,\s*entityVersion\?/,
    );
  });

  it("sqlDbEntityStoreSectionMixin createEntity is Entity-only (no dual-write)", () => {
    const src = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts",
      ),
      "utf8",
    );
    // Method signature: single Entity argument
    expect(src).toMatch(
      /async createEntity\(\s*entity\s*:\s*Entity\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
    expect(src).not.toMatch(
      /async createEntity\(\s*entity\s*:\s*Entity\s*,\s*entityVersion\?/,
    );
    // Dual-write create path must be gone
    expect(src).not.toMatch(/normalizeCreateEntityPair/);
    expect(src).not.toMatch(/transactional dual-write failed/);
    // Batch takes Entity[]
    expect(src).toMatch(
      /async createEntities\(\s*entities\s*:\s*Entity\[\]\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
  });
});
