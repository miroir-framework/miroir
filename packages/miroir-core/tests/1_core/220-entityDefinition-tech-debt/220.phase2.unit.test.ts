/**
 * #220 Phase 2 — UUID-reuse / compat helpers quarantined away from freeze.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Entity } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  presentEntityAsRedundantEntityDefinition,
} from "../../../src/1_core/entityDefinitionCompatibility.js";

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
  it("exports UUID-reuse helper from entityDefinitionCompatibility", () => {
    const entity: Entity = {
      uuid: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      name: "CompatEntity",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      parentName: "Entity",
      mlSchema: { type: "object", definition: { title: { type: "string" } } },
    };
    const projected = presentEntityAsRedundantEntityDefinition(entity, []);
    expect(projected.uuid).toBe(entity.uuid);
  });

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
