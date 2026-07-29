/**
 * #220 Phase 2 — UUID-reuse / compat helpers removed (quarantine completed by deletion).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const FREEZE_MODULE = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts",
);
const COMPAT_MODULE = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/entityDefinitionCompatibility.ts",
);

describe("220 Phase 2 — compat module removed; freeze stays clean", () => {
  it("compat module is deleted (UUID-reuse quarantine completed by removal)", () => {
    expect(existsSync(COMPAT_MODULE)).toBe(false);
  });

  it("freeze module does not import UUID-reuse / compat symbols", () => {
    const source = readFileSync(FREEZE_MODULE, "utf8");
    expect(source).not.toContain("presentEntityAsRedundantEntityDefinition");
    expect(source).not.toContain("entityDefinitionCompatibility");
  });
});
