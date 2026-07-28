import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * #217 Phase 11 — characterization / grep gate for live EntityVersion authority.
 */

const REPO_ROOT = join(import.meta.dirname, "../../../..");

const LIVE_ED_FIND =
  /entityDefinitions\s*\.\s*find\s*\(\s*(?:\([^)]*\)|[^=])*entityUuid/;

describe("217 Phase 11 — live EntityVersion authority grep gate", () => {
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

  it("ModelEntityActionTransformer dropEntity no longer requires entityVersionUuid in source", () => {
    const transformer = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/2_domain/ModelEntityActionTransformer.ts"),
      "utf8",
    );
    expect(transformer).toContain("dropEntity missing entityUuid");
    expect(transformer).not.toContain(
      "dropEntity missing entityUuid or entityVersionUuid",
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

  it("store createEntity is Entity-only (no EntityVersion param)", () => {
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
    expect(iface).toMatch(
      /createEntity\(\s*entity\s*:\s*Entity\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
    expect(iface).not.toMatch(
      /createEntity\(\s*entity\s*:\s*Entity\s*,\s*entityVersion\?/,
    );
    expect(fsMixin).toMatch(
      /async createEntity\(\s*entity\s*:\s*Entity\s*\)\s*:\s*Promise<Action2VoidReturnType>/,
    );
  });

  it("LocalCache registers PK adapters from Entity only (not EntityVersion)", () => {
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

  it("store alter/rename prefer Entity-only when present model is complete", () => {
    const fsMixin = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-store-filesystem/src/4_services/FileSystemEntityStoreSectionMixin.ts",
      ),
      "utf8",
    );
    const sqlMixin = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts",
      ),
      "utf8",
    );
    expect(fsMixin).toContain("applyEntityOnlyAlterAttribute");
    expect(fsMixin).toContain("applyEntityOnlyRename");
    expect(sqlMixin).toContain("applyEntityOnlyAlterAttribute");
    expect(sqlMixin).toContain("applyEntityOnlyRename");
  });

  it("ModelEndpoint Action schemas: create/drop/rename Entity-only; alter keeps optional entityVersionUuid", () => {
    const endpoint = JSON.parse(
      readFileSync(
        join(
          REPO_ROOT,
          "packages/miroir-test-app_deployment-miroir/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json",
        ),
        "utf8",
      ),
    );
    const generated = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
      ),
      "utf8",
    );
    expect(generated).toContain("entityVersionUuid?: string | undefined");
    // #220 — createEntity payload is Entity[], not { entity, entityVersion? }
    expect(generated).toMatch(
      /export type ModelActionCreateEntity = \{[\s\S]*?entities: Entity\[\];/,
    );
    expect(generated).not.toMatch(
      /export type ModelActionCreateEntity = \{[\s\S]*?entityVersion\?:/,
    );
    expect(generated).toMatch(
      /modelActionAlterEntityAttribute[\s\S]*entityVersionUuid:z\.string\(\)\.optional\(\)/,
    );

    const actions: any[] = [];
    const walk = (node: any) => {
      if (!node || typeof node !== "object") return;
      if (node.actionParameters) actions.push(node.actionParameters);
      if (Array.isArray(node)) node.forEach(walk);
      else Object.values(node).forEach(walk);
    };
    walk(endpoint);
    for (const name of ["alterEntityAttribute"]) {
      const ap = actions.find((a) => a.actionType?.definition === name);
      expect(ap?.payload?.definition?.entityVersionUuid?.optional).toBe(true);
    }
    const dropAp = actions.find((a) => a.actionType?.definition === "dropEntity");
    expect(dropAp?.payload?.definition?.entityVersionUuid).toBeUndefined();
    const renameAp = actions.find((a) => a.actionType?.definition === "renameEntity");
    expect(renameAp?.payload?.definition?.entityVersionUuid).toBeUndefined();
    const createAp = actions.find((a) => a.actionType?.definition === "createEntity");
    expect(createAp?.payload?.definition?.entities?.definition?.definition?.relativePath).toBe(
      "entity",
    );
  });

  it("Bundled store boot registers PK from Entity first", () => {
    const bundledModel = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-store-bundled/src/4_services/BundledModelStoreSection.ts",
      ),
      "utf8",
    );
    expect(bundledModel).toContain("Entity present-model first");
    expect(bundledModel).toContain("entity.idAttribute");
  });
});
