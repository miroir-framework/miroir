/**
 * #220 — renameEntity Entity-only (no EntityVersion dual-write).
 * Plan: renameEntity-remove-entityVersion-tdd-plan.md
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");

function renameEntityCleanBody(src: string): string {
  const start = src.search(/async renameEntityClean\s*\(/);
  expect(start).toBeGreaterThanOrEqual(0);
  const after = src.slice(start);
  const next = after.search(/\n\s*async (alterEntityAttribute|dropEntity|dropEntities)\s*\(/);
  expect(next).toBeGreaterThan(0);
  return after.slice(0, next);
}

describe("220 renameEntity Entity-only — Slice 1 store mixins", () => {
  const mixinPaths = [
    "packages/miroir-store-filesystem/src/4_services/FileSystemEntityStoreSectionMixin.ts",
    "packages/miroir-store-indexedDb/src/4_services/IndexedDbEntityStoreSectionMixin.ts",
    "packages/miroir-store-mongodb/src/4_services/MongoDbEntityStoreSectionMixin.ts",
    "packages/miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts",
  ] as const;

  it.each(mixinPaths)("%s renameEntityClean does not dual-write EntityVersion", (relPath) => {
    const src = readFileSync(join(REPO_ROOT, relPath), "utf8");
    const body = renameEntityCleanBody(src);

    expect(body).toMatch(/upsertInstance\s*\(\s*entityEntity\.uuid/);
    expect(body).not.toMatch(/persistEntityThenEntityDefinition/);
    expect(body).not.toMatch(/applyRenameEntityPair/);
    expect(body).not.toMatch(/entityVersionUuid/);
    expect(body).not.toMatch(/upsertInstance\s*\(\s*entityEntityDefinition\.uuid/);
  });
});

describe("220 renameEntity Entity-only — Slice 2 planner + transformer", () => {
  it("modelEntityActionLiveResolve planner is deleted", () => {
    expect(
      existsSync(
        join(REPO_ROOT, "packages/miroir-core/src/1_core/modelEntityActionLiveResolve.ts"),
      ),
    ).toBe(false);
  });

  it("ModelEntityActionTransformer renameEntity is Entity-only inline", () => {
    const src = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/2_domain/ModelEntityActionTransformer.ts"),
      "utf8",
    );
    const start = src.indexOf('case "renameEntity"');
    const end = src.indexOf('case "alterEntityAttribute"', start);
    const body = src.slice(start, end);
    expect(body).toMatch(/name:\s*modelAction\.payload\.targetValue/);
    expect(body).not.toContain("planRenameEntityMutation");
    expect(body).not.toContain("entityVersionUuid");
    expect(body).not.toContain("dualWrite");
  });
});

describe("220 renameEntity Entity-only — Slice 3 action schema", () => {
  it("ModelEndpoint renameEntity payload has no entityVersionUuid", () => {
    const endpoint = JSON.parse(
      readFileSync(
        join(
          REPO_ROOT,
          "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
          "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
          "7947ae40-eb34-4149-887b-15a9021e714e.json",
        ),
        "utf8",
      ),
    );
    const actions: any[] = [];
    const walk = (node: any) => {
      if (!node || typeof node !== "object") return;
      if (node.actionParameters) actions.push(node.actionParameters);
      if (Array.isArray(node)) node.forEach(walk);
      else Object.values(node).forEach(walk);
    };
    walk(endpoint);
    const renameAp = actions.find((a) => a.actionType?.definition === "renameEntity");
    expect(renameAp?.payload?.definition?.entityUuid).toBeDefined();
    expect(renameAp?.payload?.definition?.targetValue).toBeDefined();
    expect(renameAp?.payload?.definition?.entityVersionUuid).toBeUndefined();
  });
});

describe("220 renameEntity Entity-only — Slice 5 grep gate", () => {
  it("no renameEntity action construction passes entityVersionUuid (excl. generated/LEGACY)", () => {
    const roots = [
      "packages/miroir-core/src",
      "packages/miroir-core/tests",
      "packages/miroir-standalone-app",
      "packages/miroir-store-filesystem",
      "packages/miroir-store-indexedDb",
      "packages/miroir-store-mongodb",
      "packages/miroir-store-postgres",
      "packages/miroir-test-app_deployment-miroir/assets",
    ];
    const offenders: string[] = [];
    const skip = new Set(["node_modules", "dist", "preprocessor-generated"]);
    const payloadRe =
      /actionType\s*[:=]\s*["']renameEntity["'][\s\S]{0,120}?payload\s*[:=]\s*\{([\s\S]{0,300}?)\}/;

    const walk = (dir: string) => {
      let entries;
      try {
        entries = readdirSync(dir);
      } catch {
        return;
      }
      for (const name of entries) {
        if (skip.has(name)) continue;
        const full = join(dir, name);
        let st;
        try {
          st = statSync(full);
        } catch {
          continue;
        }
        if (st.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx|json)$/.test(name)) continue;
        if (name.includes("220.renameEntity-entity-only")) continue;
        if (/LEGACY/.test(full)) continue;
        const text = readFileSync(full, "utf8");
        for (const m of text.matchAll(new RegExp(payloadRe, "g"))) {
          const payloadBody = m[1] ?? "";
          const hasLive = payloadBody
            .split("\n")
            .some(
              (line) =>
                line.includes("entityVersionUuid") &&
                !/^\s*\/\//.test(line) &&
                !/^\s*\*/.test(line),
            );
          if (hasLive) {
            offenders.push(full.replace(/\\/g, "/"));
            break;
          }
        }
      }
    };

    for (const r of roots) {
      walk(join(REPO_ROOT, r));
    }
    expect(offenders).toEqual([]);
  });
});
