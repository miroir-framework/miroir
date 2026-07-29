/**
 * #220 Phase 4 — dual-write persistence call-site allowlist / quarantine.
 *
 * persistEntityThenEntityDefinition may remain on store mixins for legacy ED
 * payloads, but must not appear in freeze or Action planner modules.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const PACKAGES = join(REPO_ROOT, "packages");

/** Relative paths (posix) allowed to reference persistEntityThenEntityDefinition. */
const ALLOWLIST = new Set([
  "miroir-core/src/1_core/modelEntityDualWritePersistence.ts",
  "miroir-core/src/1_core/entityDefinitionCompatibility.ts",
  "miroir-core/src/index.ts",
  "miroir-core/tests/1_core/modelEntityDualWritePersistence.unit.test.ts",
  "miroir-core/tests/1_core/220-entityVersion-tech-debt/220.phase0.unit.test.ts",
  "miroir-core/tests/1_core/220-entityVersion-tech-debt/220.phase4.unit.test.ts",
  "miroir-store-filesystem/src/4_services/FileSystemEntityStoreSectionMixin.ts",
  "miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts",
  "miroir-store-mongodb/src/4_services/MongoDbEntityStoreSectionMixin.ts",
  "miroir-store-indexedDb/src/4_services/IndexedDbEntityStoreSectionMixin.ts",
]);

const FORBIDDEN_MODULES = [
  "miroir-core/src/1_core/applicationVersionFreeze.ts",
  "miroir-core/src/2_domain/ModelEntityActionTransformer.ts",
  "miroir-core/src/1_core/modelEntityActionLiveResolve.ts",
];

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "release") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTsFiles(full, out);
    } else if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

describe("220 Phase 4 — persistEntityThenEntityDefinition call-site allowlist", () => {
  it("only allowlisted packages reference persistEntityThenEntityDefinition", () => {
    const offenders: string[] = [];
    for (const file of walkTsFiles(PACKAGES)) {
      const rel = relative(PACKAGES, file).replace(/\\/g, "/");
      if (rel.includes("preprocessor-generated")) continue;
      const text = readFileSync(file, "utf8");
      if (!text.includes("persistEntityThenEntityDefinition")) continue;
      if (!ALLOWLIST.has(rel)) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("freeze / Action planner modules do not dual-persist", () => {
    for (const rel of FORBIDDEN_MODULES) {
      const text = readFileSync(join(PACKAGES, rel), "utf8");
      expect(text, rel).not.toContain("persistEntityThenEntityDefinition");
    }
  });
});
