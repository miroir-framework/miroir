/**
 * #220 Phase 5 — entityVersions accessors + freeze handoff vocabulary.
 */
import { describe, expect, it } from "vitest";


import type {
  Entity,
  EntityVersion
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

import { snapshotEntitiesAsHistoricalEntityVersions } from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

describe("220 Phase 5 — #216 handoff: snapshot ≠ UUID-reuse", () => {
  it("historical snapshot mints new UUIDs; compat helper reuses live uuid", () => {
    const entity: Entity = {
      uuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Handoff",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      parentName: "Entity",
      mlSchema: { type: "object", definition: { title: { type: "string" } } },
    };
    const [historical]: EntityVersion[] = snapshotEntitiesAsHistoricalEntityVersions([entity], {
      newUuid: () => "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });

    expect(historical.uuid).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(historical.uuid).not.toBe(entity.uuid);
    expect(historical.parentName).toBe("EntityVersion");
  });
});
