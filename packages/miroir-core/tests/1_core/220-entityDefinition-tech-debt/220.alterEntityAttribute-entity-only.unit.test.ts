/**
 * #220 — alterEntityAttribute Entity-only (no EntityVersion dual-write).
 * Plan: alterEntityAttribute-entity-only-tdd-plan.md
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");

function alterEntityAttributeBody(src: string): string {
  const start = src.search(/async alterEntityAttribute\s*\(/);
  expect(start).toBeGreaterThanOrEqual(0);
  const after = src.slice(start);
  // Skip the opening `async alterEntityAttribute` then take until the next method (or EOF).
  const nextRel = after.slice(1).search(/\n\s*async \w+\s*\(/);
  return nextRel >= 0 ? after.slice(0, nextRel + 1) : after;
}

describe("220 alterEntityAttribute Entity-only — Slice 1 store mixins", () => {
  const mixinPaths = [
    "packages/miroir-store-filesystem/src/4_services/FileSystemEntityStoreSectionMixin.ts",
    "packages/miroir-store-indexedDb/src/4_services/IndexedDbEntityStoreSectionMixin.ts",
    "packages/miroir-store-mongodb/src/4_services/MongoDbEntityStoreSectionMixin.ts",
    "packages/miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts",
  ] as const;

  it.each(mixinPaths)("%s alterEntityAttribute does not dual-write EntityVersion", (relPath) => {
    const src = readFileSync(join(REPO_ROOT, relPath), "utf8");
    const body = alterEntityAttributeBody(src);

    // Entity-only alter is inlined via applyMlSchemaColumnChanges (no applyEntityOnlyAlterAttribute helper).
    expect(body).toMatch(/applyMlSchemaColumnChanges/);
    expect(body).not.toMatch(/applyEntityOnlyAlterAttribute/);
    expect(body).toMatch(/upsertInstance\s*\(\s*entityEntity\.uuid/);
    expect(body).not.toMatch(/persistEntityThenEntityDefinition/);
    expect(body).not.toMatch(/applyAlterEntityAttributePair/);
    expect(body).not.toMatch(/entityVersionUuid/);
    expect(body).not.toMatch(/upsertInstance\s*\(\s*entityEntityDefinition\.uuid/);
  });
});

describe("220 alterEntityAttribute Entity-only — Slice 2 planner + transformer", () => {
  it("modelEntityActionLiveResolve planner is deleted", () => {
    expect(
      existsSync(
        join(REPO_ROOT, "packages/miroir-core/src/1_core/modelEntityActionLiveResolve.ts"),
      ),
    ).toBe(false);
  });

  it("ModelEntityActionTransformer alterEntityAttribute is Entity-only inline", () => {
    const src = readFileSync(
      join(REPO_ROOT, "packages/miroir-core/src/2_domain/ModelEntityActionTransformer.ts"),
      "utf8",
    );
    const start = src.indexOf('case "alterEntityAttribute"');
    const end = src.indexOf('case "initModel"', start);
    const body = src.slice(start, end > start ? end : start + 800);
    expect(body).toContain("applyMlSchemaColumnChanges");
    expect(body).not.toContain("planAlterEntityAttributeMutation");
    expect(body).not.toContain("entityVersionUuid");
    expect(body).not.toContain("dualWrite");
  });
});

describe("220 alterEntityAttribute Entity-only — Slice 3 action schema", () => {
  it("ModelEndpoint alterEntityAttribute payload has no entityVersionUuid", () => {
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
    const alterAp = endpoint.definition.actions.find(
      (a: any) => a?.actionParameters?.actionType?.definition === "alterEntityAttribute",
    )?.actionParameters;
    expect(alterAp?.payload?.definition?.entityVersionUuid).toBeUndefined();
    expect(alterAp?.payload?.definition?.entityUuid).toBeTruthy();
  });

  it("generated types have no entityVersionUuid on alterEntityAttribute", () => {
    const src = readFileSync(
      join(
        REPO_ROOT,
        "packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts",
      ),
      "utf8",
    );
    const start = src.indexOf('actionType: "alterEntityAttribute"');
    expect(start).toBeGreaterThanOrEqual(0);
    // first alter payload block ends at next actionType or closing
    const end = src.indexOf('actionType: "entity_DuplicateAttribute"', start);
    const body = src.slice(start, end > start ? end : start + 600);
    expect(body).toContain("entityUuid");
    expect(body).not.toContain("entityVersionUuid");
  });
});

describe("220 alterEntityAttribute Entity-only — Slice 5 callers grep gate", () => {
  it("no alterEntityAttribute action construction passes entityVersionUuid (excl. generated/LEGACY)", () => {
    const roots = [
      join(REPO_ROOT, "packages/miroir-core/src"),
      join(REPO_ROOT, "packages/miroir-core/tests"),
      join(REPO_ROOT, "packages/miroir-standalone-app/tests"),
      join(REPO_ROOT, "packages/miroir-test-app_deployment-miroir/assets"),
    ];
    const skip = (p: string) =>
      p.includes("preprocessor-generated") ||
      p.includes("LEGACY") ||
      p.includes("node_modules") ||
      p.includes("dist") ||
      p.endsWith("220.alterEntityAttribute-entity-only.unit.test.ts");

    const offenders: string[] = [];

    function walk(dir: string) {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (skip(p)) continue;
        const st = statSync(p);
        if (st.isDirectory()) {
          walk(p);
          continue;
        }
        if (!/\.(ts|tsx|json)$/.test(name)) continue;
        const text = readFileSync(p, "utf8");
        if (!text.includes("alterEntityAttribute")) continue;
        const lines = text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trimStart();
          if (
            !line.includes("entityVersionUuid") ||
            trimmed.startsWith("//") ||
            trimmed.startsWith("*") ||
            trimmed.includes("not.toHaveProperty") ||
            trimmed.includes("not.toContain") ||
            trimmed.includes("not.toMatch") ||
            trimmed.includes("toBeUndefined()")
          ) {
            continue;
          }
          // Flag payload assignments / schema properties only.
          if (!/["']?entityVersionUuid["']?\s*[:=]/.test(line)) {
            continue;
          }
          const window = lines.slice(Math.max(0, i - 8), i + 3).join("\n");
          if (window.includes("alterEntityAttribute")) {
            offenders.push(`${p}:${i + 1}`);
          }
        }
      }
    }

    for (const root of roots) {
      walk(root);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
