import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * #217 Phase 11 — characterization / grep gate for live EntityDefinition authority.
 */

const REPO_ROOT = join(import.meta.dirname, "../../../..");

const LIVE_ED_FIND =
  /entityDefinitions\s*\.\s*find\s*\(\s*(?:\([^)]*\)|[^=])*entityUuid/;

describe("217 Phase 11 — live EntityDefinition authority grep gate", () => {
  it("SqlGenerator does not join live schema/PK via entityDefinitions.find(entityUuid)", () => {
    const sqlGenerator = readFileSync(
      join(REPO_ROOT, "packages/miroir-store-postgres/src/1_core/SqlGenerator.ts"),
      "utf8",
    );
    expect(sqlGenerator).not.toMatch(LIVE_ED_FIND);
    expect(sqlGenerator).toContain("resolvePresentEntityFromModel");
  });

  it("SqlDbStoreSection boot prefers Entity present-model fields", () => {
    const section = readFileSync(
      join(REPO_ROOT, "packages/miroir-store-postgres/src/4_services/SqlDbStoreSection.ts"),
      "utf8",
    );
    expect(section).toContain("Phase 11");
    expect(section).toContain("fromMiroirPresentModelToSequelizeEntityDefinition");
  });

  it("filesystem / IndexedDB boot register PK from Entity first", () => {
    const fsSection = readFileSync(
      join(REPO_ROOT, "packages/miroir-store-filesystem/src/4_services/FileSystemStoreSection.ts"),
      "utf8",
    );
    const idbSection = readFileSync(
      join(REPO_ROOT, "packages/miroir-store-indexedDb/src/4_services/IndexedDbStoreSection.ts"),
      "utf8",
    );
    expect(fsSection).toContain("entity.idAttribute");
    expect(idbSection).toContain("entity.idAttribute");
  });

  it("ModelEntityActionTransformer dropEntity no longer requires entityDefinitionUuid in source", () => {
    const transformer = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/2_domain/ModelEntityActionTransformer.ts"),
      "utf8",
    );
    expect(transformer).toContain("dropEntity missing entityUuid");
    expect(transformer).not.toContain(
      "dropEntity missing entityUuid or entityDefinitionUuid",
    );
  });

  it("createEntity Action path uses planCreateEntityMutation (Entity-only when complete)", () => {
    const transformer = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/2_domain/ModelEntityActionTransformer.ts"),
      "utf8",
    );
    expect(transformer).toContain("planCreateEntityMutation");
    expect(transformer).not.toContain("resolveOrSynthesizeEntityDefinitionForCreate");
  });

  it("store createEntity accepts optional EntityDefinition (filesystem + interface)", () => {
    const iface = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerInterface.ts",
      ),
      "utf8",
    );
    const fsMixin = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-store-filesystem/src/4_services/FileSystemEntityStoreSectionMixin.ts",
      ),
      "utf8",
    );
    expect(iface).toMatch(/createEntity\(\s*entity:Entity,\s*entityDefinition\?: EntityDefinition/);
    expect(fsMixin).toContain("Entity-only when ED omitted");
  });

  it("LocalCache registers PK adapters from Entity only (not EntityDefinition)", () => {
    const redux = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-localcache-redux/src/4_services/localCache/LocalCacheSlice.ts",
      ),
      "utf8",
    );
    const zustand = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-localcache-zustand/src/4_services/localCache/LocalCacheSlice.ts",
      ),
      "utf8",
    );
    expect(redux).toContain("register PK from Entity only");
    expect(zustand).toContain("register PK from Entity only");
    expect(redux).not.toMatch(
      /parentUuid === entityEntityDefinition\.uuid[\s\S]{0,120}registerEntityAdapterFromPresentModelSource/,
    );
  });
});
