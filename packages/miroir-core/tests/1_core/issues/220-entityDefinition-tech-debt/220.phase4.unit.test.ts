/**
 * #220 Phase 4 — dual-write persistence removed.
 *
 * persistEntityThenEntityDefinition must not appear in production packages.
 * Characterization tests may name it only as a forbidden symbol.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");
const PACKAGES = join(REPO_ROOT, "packages");

/** Relative paths (posix) allowed to *mention* persistEntityThenEntityDefinition (negative gates only). */
const ALLOWLIST = new Set([
  "miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.phase0.unit.test.ts",
  "miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.phase4.unit.test.ts",
  "miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.createEntity-entity-only.unit.test.ts",
  "miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.renameEntity-entity-only.unit.test.ts",
  "miroir-core/tests/1_core/220-entityDefinition-tech-debt/220.alterEntityAttribute-entity-only.unit.test.ts",
]);

const FORBIDDEN_MODULES = [
  "miroir-core/src/1_core/versioning/applicationVersionFreeze.ts",
  "miroir-core/src/2_domain/ModelEntityActionTransformer.ts",
];

const DELETED_DUAL_WRITE_MODULES = [
  "miroir-core/src/1_core/modelEntityDualWritePersistence.ts",
  "miroir-core/src/1_core/entityDefinitionCompatibility.ts",
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

describe("220 Phase 4 — persistEntityThenEntityDefinition removed", () => {
  it("only characterization gates mention persistEntityThenEntityDefinition", () => {
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

  it("freeze / Action transformer modules do not dual-persist", () => {
    for (const rel of FORBIDDEN_MODULES) {
      const text = readFileSync(join(PACKAGES, rel), "utf8");
      expect(text, rel).not.toContain("persistEntityThenEntityDefinition");
    }
  });

  it("dual-write persistence / planner / compat modules are deleted", () => {
    for (const rel of DELETED_DUAL_WRITE_MODULES) {
      expect(existsSync(join(PACKAGES, rel)), rel).toBe(false);
    }
  });
});
