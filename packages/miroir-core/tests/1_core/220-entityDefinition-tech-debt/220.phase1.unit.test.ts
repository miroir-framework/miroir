/**
 * #220 Phase 1 — freeze module vocabulary: EntityVersion only (no EntityVersion identifier).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const FREEZE_MODULE = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/applicationVersionFreeze.ts",
);

describe("220 Phase 1 — freeze module greppable clean of EntityVersion", () => {
  it("applicationVersionFreeze.ts has zero EntityVersion identifiers", () => {
    const source = readFileSync(FREEZE_MODULE, "utf8");
    expect(source).not.toMatch(/\bEntityDefinition\b/);
  });
});
