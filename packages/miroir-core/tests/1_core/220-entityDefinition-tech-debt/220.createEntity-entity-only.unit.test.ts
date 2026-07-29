/**
 * #220 — createEntity Entity-only (no entityVersion param).
 * Slices 1–3 of createEntity-remove-entityVersion-tdd-plan.md
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
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

describe("220 createEntity Entity-only — Slice 3 planner + transformer", () => {
  it("planCreateEntityMutation is Entity-only (arity 1, no dual-write)", () => {
    const src = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/1_core/modelEntityActionLiveResolve.ts",
      ),
      "utf8",
    );
    const fnStart = src.search(/export function planCreateEntityMutation\(/);
    const nextExport = src.indexOf("\nexport function ", fnStart + 1);
    const body = src.slice(fnStart, nextExport === -1 ? undefined : nextExport);
    expect(body).toMatch(
      /export function planCreateEntityMutation\(\s*entity\s*:\s*Entity\s*,?\s*\)/,
    );
    expect(body).not.toMatch(/entityVersion/);
    expect(body).not.toMatch(/normalizeCreateEntityPair/);
    expect(body).not.toMatch(/dualWrite/);
  });

  it("ModelEntityActionTransformer createEntity emits Entity-only createInstance", () => {
    const src = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/2_domain/ModelEntityActionTransformer.ts",
      ),
      "utf8",
    );
    const caseStart = src.search(/case "createEntity":/);
    const nextCase = src.indexOf('case "', caseStart + 1);
    const body = src.slice(caseStart, nextCase === -1 ? undefined : nextCase);
    expect(body).toMatch(/for \(const entity of modelAction\.payload\.entities\)/);
    expect(body).toMatch(/planCreateEntityMutation\(entity\)/);
    expect(body).not.toMatch(/pair\.entity/);
    expect(body).toMatch(/complete Entity\.mlSchema/);
  });
});

describe("220 createEntity Entity-only — Slice 4 Action schema", () => {
  it("ModelEndpoint createEntity entities is schemaReference entity (no entityVersion pair)", () => {
    const src = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-test-app_deployment-miroir/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json",
      ),
      "utf8",
    );
    const createIdx = src.indexOf('"definition": "createEntity"');
    expect(createIdx).toBeGreaterThan(-1);
    const dropIdx = src.indexOf('"definition": "dropEntity"', createIdx);
    const createSection = src.slice(createIdx, dropIdx === -1 ? undefined : dropIdx);
    expect(createSection).toMatch(/"relativePath": "entity"/);
    expect(createSection).not.toMatch(/"relativePath": "entityVersion"/);
    expect(createSection).not.toMatch(/"entityVersion"/);
  });
});

describe("220 createEntity Entity-only — Slice 7 cleanup gate", () => {
  it("normalizeCreateEntityPair is gone from modelEntityDualWrite and index exports", () => {
    const dualWrite = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/1_core/modelEntityDualWrite.ts"),
      "utf8",
    );
    const index = readFileSync(join(REPO_ROOT, "packages/miroir-core/src/index.ts"), "utf8");
    expect(dualWrite).not.toMatch(/export function normalizeCreateEntityPair/);
    expect(index).not.toMatch(/\bnormalizeCreateEntityPair\b/);
  });

  it("packages/**/src createEntity Action payloads do not couple entityVersion", () => {
    // Scan source for createEntity action blocks that still assign entityVersion in entities
    const packagesRoot = join(REPO_ROOT, "packages");
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const name of readdirSync(dir)) {
        if (name === "node_modules" || name === "dist" || name === "tests") continue;
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(name) || name.endsWith(".d.ts")) continue;
        if (!full.replace(/\\/g, "/").includes("/src/")) continue;
        const text = readFileSync(full, "utf8");
        // createEntity action with entities containing entityVersion: (pair shape)
        if (
          /actionType:\s*["']createEntity["'][\s\S]{0,1200}?entities:\s*\[[\s\S]{0,800}?entityVersion\s*:/.test(
            text,
          )
        ) {
          offenders.push(full.replace(/\\/g, "/").replace(REPO_ROOT.replace(/\\/g, "/") + "/", ""));
        }
      }
    }
    walk(packagesRoot);
    expect(offenders, `createEntity still couples entityVersion:\n${offenders.join("\n")}`).toEqual(
      [],
    );
  });
});
