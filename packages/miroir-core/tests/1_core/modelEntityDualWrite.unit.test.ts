/**
 * #217 Phase 5 — modelEntityDualWrite pure helpers.
 * #220 compat suite — dual-write pair construction (not present-model authority).
 */
import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  applyEntityOnlyRename,
  applyMlSchemaColumnChanges
} from "../../src/1_core/Entity/modelEntityDualWrite.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity: Entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;

describe("217 Phase 5 — applyMlSchemaColumnChanges", () => {
  it("adds and removes attributes", () => {
    const next = applyMlSchemaColumnChanges(bookEntity.mlSchema, {
      removeColumns: ["year"],
      addColumns: [{ name: "isbn", definition: { type: "string" } }],
    });
    expect(next.definition).not.toHaveProperty("year");
    expect(next.definition).toHaveProperty("isbn");
    expect(next.definition).toHaveProperty("name");
  });
});

// #220 — normalizeCreateEntityPair create dual-write tests removed (create is Entity-only).

describe("217 Phase 11 — Entity-only store mutations", () => {
  it("applyEntityOnlyRename renames Entity without needing EntityVersion", () => {
    const next = applyEntityOnlyRename(bookEntity, "Volume");
    expect(next).toBeDefined();
    expect(next!.name).toBe("Volume");
  });

});
