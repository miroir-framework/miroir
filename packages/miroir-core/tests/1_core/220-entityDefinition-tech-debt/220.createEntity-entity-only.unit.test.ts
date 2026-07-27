/**
 * #220 — createEntity Entity-only (no entityVersion param).
 * Slice 1–2 of createEntity-remove-entityVersion-tdd-plan.md
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
    expect(src).toMatch(
      /async createEntity\(\s*entity\s*:\s*Entity\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
    expect(src).not.toMatch(
      /async createEntity\(\s*entity\s*:\s*Entity\s*,\s*entityVersion\?/,
    );
    expect(src).not.toMatch(/normalizeCreateEntityPair/);
    expect(src).not.toMatch(/transactional dual-write failed/);
    expect(src).toMatch(
      /async createEntities\(\s*entities\s*:\s*Entity\[\]\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
  });
});

describe("220 createEntity Entity-only — Slice 2 FS / IndexedDB / Mongo", () => {
  const mixinPaths = [
    "packages/miroir-store-filesystem/src/4_services/FileSystemEntityStoreSectionMixin.ts",
    "packages/miroir-store-indexedDb/src/4_services/IndexedDbEntityStoreSectionMixin.ts",
    "packages/miroir-store-mongodb/src/4_services/MongoDbEntityStoreSectionMixin.ts",
  ] as const;

  it.each(mixinPaths)("%s createEntity is Entity-only (no dual-write on create)", (relPath) => {
    const src = readFileSync(join(REPO_ROOT, relPath), "utf8");
    expect(src).toMatch(
      /async createEntity\(\s*entity\s*:\s*Entity\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
    expect(src).not.toMatch(
      /async createEntity\(\s*entity\s*:\s*Entity\s*,\s*entityVersion\?/,
    );
    const createBody = src.slice(
      src.search(/async createEntity\(/),
      src.search(/async createEntities\(/),
    );
    expect(createBody).not.toMatch(/normalizeCreateEntityPair/);
    expect(createBody).not.toMatch(/persistEntityThenEntityDefinition/);
    expect(src).toMatch(
      /async createEntities\(\s*entities\s*:\s*Entity\[\]\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
  });
});
