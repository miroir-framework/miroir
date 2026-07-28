/**
 * #220 Phase 2 — UUID-reuse / compat helpers quarantined away from freeze.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";


const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const FREEZE_MODULE = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/applicationVersionFreeze.ts",
);
const COMPAT_MODULE = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/entityDefinitionCompatibility.ts",
);

describe("220 Phase 2 — compat module quarantine", () => {
  it("compat module documents freeze ban and EOL", () => {
    const source = readFileSync(COMPAT_MODULE, "utf8");
    expect(source).toMatch(/#220/);
    expect(source).toMatch(/EOL|unsafe for freeze|Do \*\*not\*\* use for/i);
  });

  it("freeze module still does not import compat UUID-reuse symbols", () => {
    const source = readFileSync(FREEZE_MODULE, "utf8");
    expect(source).not.toContain("presentEntityAsRedundantEntityDefinition");
    expect(source).not.toContain("entityDefinitionCompatibility");
  });
});
