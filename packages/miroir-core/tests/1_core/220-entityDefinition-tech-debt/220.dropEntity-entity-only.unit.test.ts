/**
 * #220 — dropEntity Entity-only (no EntityVersion cascade).
 * Plan: dropEntity-remove-entityVersion-tdd-plan.md
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");

function dropEntityMethodBody(src: string): string {
  const start = src.search(/async dropEntity\s*\(/);
  expect(start).toBeGreaterThanOrEqual(0);
  const after = src.slice(start);
  const next = after.search(/\n\s*async (dropEntities|renameEntityClean|alterEntityAttribute)\s*\(/);
  expect(next).toBeGreaterThan(0);
  return after.slice(0, next);
}

describe("220 dropEntity Entity-only — Slice 1 store mixins", () => {
  const mixinPaths = [
    "packages/miroir-store-filesystem/src/4_services/FileSystemEntityStoreSectionMixin.ts",
    "packages/miroir-store-indexedDb/src/4_services/IndexedDbEntityStoreSectionMixin.ts",
    "packages/miroir-store-mongodb/src/4_services/MongoDbEntityStoreSectionMixin.ts",
    "packages/miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts",
  ] as const;

  it.each(mixinPaths)("%s dropEntity does not delete EntityVersion instances", (relPath) => {
    const src = readFileSync(join(REPO_ROOT, relPath), "utf8");
    const body = dropEntityMethodBody(src);

    // Must delete the Entity row.
    expect(body).toMatch(/deleteInstance\s*\(\s*entityEntity\.uuid/);

    // Must not cascade-delete EntityVersion / entityDefinition rows.
    expect(body).not.toMatch(/deleteInstance\s*\(\s*entityEntityDefinition\.uuid/);
    expect(body).not.toMatch(/\.entityUuid\s*==\s*entityUuid/);
    expect(body).not.toMatch(/\(i as EntityVersion\)\.entityUuid/);
  });
});

describe("220 dropEntity Entity-only — Slice 2 transformer", () => {
  it("ModelEntityActionTransformer dropEntity does not resolve or delete EntityVersion", () => {
    const src = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/2_domain/ModelEntityActionTransformer.ts"),
      "utf8",
    );
    const start = src.indexOf('case "dropEntity"');
    const end = src.indexOf('case "renameEntity"', start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const body = src.slice(start, end);
    expect(body).toContain("entityEntity.uuid");
    expect(body).not.toContain("resolveLiveEntityDefinitionForAction");
    expect(body).not.toContain("entityEntityDefinition");
    expect(body).not.toContain("entityVersionUuid");
  });
});

describe("220 dropEntity Entity-only — Slice 3 action schema", () => {
  it("ModelEndpoint dropEntity payload has no entityVersionUuid", () => {
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
    const dropAp = actions.find((a) => a.actionType?.definition === "dropEntity");
    expect(dropAp?.payload?.definition?.entityUuid).toBeDefined();
    expect(dropAp?.payload?.definition?.entityVersionUuid).toBeUndefined();
  });
});

describe("220 dropEntity Entity-only — Slice 5 grep gate", () => {
  it("no dropEntity action construction passes entityVersionUuid in packages (excl. generated/docs/LEGACY)", () => {
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
      /actionType\s*[:=]\s*["']dropEntity["'][\s\S]{0,120}?payload\s*[:=]\s*\{([\s\S]{0,250}?)\}/;

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
        if (name.includes("220.dropEntity-entity-only")) continue;
        if (/LEGACY/.test(full)) continue;
        const text = readFileSync(full, "utf8");
        for (const m of text.matchAll(new RegExp(payloadRe, "g"))) {
          const payloadBody = m[1] ?? "";
          const hasLiveEntityVersionUuid = payloadBody
            .split("\n")
            .some(
              (line) =>
                line.includes("entityVersionUuid") &&
                !/^\s*\/\//.test(line) &&
                !/^\s*\*/.test(line),
            );
          if (hasLiveEntityVersionUuid) {
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
