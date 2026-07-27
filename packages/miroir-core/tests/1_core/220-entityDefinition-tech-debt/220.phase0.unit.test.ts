/**
 * #220 Phase 0 — characterization locks & dividing-line guards.
 *
 * Freeze must never call UUID-reuse / dual-write compat helpers for historical minting.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { EntityVersion } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { snapshotEntitiesAsHistoricalEntityVersions } from "../../../src/1_core/applicationVersionFreeze.js";
import type { Entity } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const REPO_ROOT = join(import.meta.dirname, "../../../../..");
const FREEZE_MODULE = join(
  REPO_ROOT,
  "packages/miroir-core/src/1_core/applicationVersionFreeze.ts",
);

const FORBIDDEN_IN_FREEZE = [
  "presentEntityAsRedundantEntityDefinition",
  "resolveOrSynthesizeEntityDefinitionForCreate",
  "persistEntityThenEntityDefinition",
] as const;

describe("220 Phase 0 — freeze must not import UUID-reuse / dual-write helpers", () => {
  it("applicationVersionFreeze.ts does not reference forbidden compat symbols", () => {
    const source = readFileSync(FREEZE_MODULE, "utf8");
    for (const symbol of FORBIDDEN_IN_FREEZE) {
      expect(source, `freeze must not reference ${symbol}`).not.toContain(symbol);
    }
  });
});

describe("220 Phase 0 — snapshot return typed as EntityVersion", () => {
  it("assigns snapshot result as EntityVersion (not live Entity uuid)", () => {
    const entity: Entity = {
      uuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Book",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      parentName: "Entity",
      mlSchema: { type: "object", definition: { title: { type: "string" } } },
    };
    const [ev]: EntityVersion[] = snapshotEntitiesAsHistoricalEntityVersions([entity], {
      newUuid: () => "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
    expect(ev.uuid).not.toBe(entity.uuid);
    expect(ev.entityUuid).toBe(entity.uuid);
    expect(ev.parentName).toBe("EntityVersion");
  });
});
