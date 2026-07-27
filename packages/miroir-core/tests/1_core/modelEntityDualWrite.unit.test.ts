/**
 * #217 Phase 5 — modelEntityDualWrite pure helpers.
 * #220 compat suite — dual-write pair construction (not present-model authority).
 */
import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  applyAlterEntityAttributePair,
  applyEntityOnlyAlterAttribute,
  applyEntityOnlyRename,
  applyMlSchemaColumnChanges,
  applyRenameEntityPair,
  normalizeCreateEntityPair,
} from "../../src/1_core/modelEntityDualWrite.js";
import {
  compareEntityPresentModelDefinitions,
  projectEntityPresentModelDefinition,
} from "../../src/1_core/entityPresentModel.js";

const bookEntity = defaultLibraryAppModel.entities.find(
  (entity) => entity.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
)!;
const bookDefinition = defaultLibraryAppModel.entityVersions.find(
  (definition) => definition.entityUuid === bookEntity.uuid,
)!;

describe("217 Phase 5 — applyMlSchemaColumnChanges", () => {
  it("adds and removes attributes", () => {
    const next = applyMlSchemaColumnChanges(bookDefinition.mlSchema, {
      removeColumns: ["year"],
      addColumns: [{ name: "isbn", definition: { type: "string" } }],
    });
    expect(next.definition).not.toHaveProperty("year");
    expect(next.definition).toHaveProperty("isbn");
    expect(next.definition).toHaveProperty("name");
  });
});

describe("217 Phase 5 — normalizeCreateEntityPair", () => {
  it("keeps Entity authoritative and aligns EntityVersion for complete Entity", () => {
    const pair = normalizeCreateEntityPair(bookEntity, bookDefinition);
    expect(pair.entity).toBe(bookEntity);
    expect(compareEntityPresentModelDefinitions(pair.entity, pair.entityVersion).equal).toBe(
      true,
    );
    expect(pair.entityVersion.uuid).toBe(bookDefinition.uuid);
  });

  it("enriches legacy incomplete Entity from EntityVersion then dual-writes", () => {
    const legacyEntity: Entity = {
      uuid: bookEntity.uuid,
      name: bookEntity.name,
      parentUuid: bookEntity.parentUuid,
      parentName: bookEntity.parentName,
      description: bookEntity.description,
    };
    const pair = normalizeCreateEntityPair(legacyEntity, bookDefinition);
    expect(pair.entity.mlSchema).toEqual(bookDefinition.mlSchema);
    expect(compareEntityPresentModelDefinitions(pair.entity, pair.entityVersion).equal).toBe(
      true,
    );
  });

  it("prefers Entity definition fields over diverging EntityVersion on create", () => {
    const entity: Entity = {
      ...bookEntity,
      viewAttributes: ["titleOnly"],
    };
    const pair = normalizeCreateEntityPair(entity, bookDefinition);
    expect(pair.entity.viewAttributes).toEqual(["titleOnly"]);
    expect(pair.entityVersion.viewAttributes).toEqual(["titleOnly"]);
  });
});

describe("217 Phase 5 — applyAlterEntityAttributePair", () => {
  it("updates Entity.mlSchema and dual-writes EntityVersion", () => {
    const pair = applyAlterEntityAttributePair(bookEntity, bookDefinition, {
      addColumns: [{ name: "isbn", definition: { type: "string" } }],
    });
    expect(pair.entity.mlSchema?.definition).toHaveProperty("isbn");
    expect(pair.entityVersion.mlSchema.definition).toHaveProperty("isbn");
    expect(compareEntityPresentModelDefinitions(pair.entity, pair.entityVersion).equal).toBe(
      true,
    );
  });

  it("removes columns from both Entity and EntityVersion", () => {
    const pair = applyAlterEntityAttributePair(bookEntity, bookDefinition, {
      removeColumns: ["year"],
    });
    expect(pair.entity.mlSchema?.definition).not.toHaveProperty("year");
    expect(pair.entityVersion.mlSchema.definition).not.toHaveProperty("year");
  });
});

describe("217 Phase 5 — applyRenameEntityPair", () => {
  it("renames Entity and aligned EntityVersion together", () => {
    const pair = applyRenameEntityPair(bookEntity, bookDefinition, "Tome");
    expect(pair.entity.name).toBe("Tome");
    expect(pair.entityVersion.name).toBe("Tome");
    expect(
      projectEntityPresentModelDefinition(pair.entity).mlSchema,
    ).toEqual(projectEntityPresentModelDefinition(pair.entityVersion).mlSchema);
  });
});

describe("217 Phase 11 — Entity-only store mutations", () => {
  it("applyEntityOnlyAlterAttribute mutates Entity.mlSchema without needing EntityVersion", () => {
    const next = applyEntityOnlyAlterAttribute(bookEntity, {
      addColumns: [{ name: "isbnStore", definition: { type: "string" } }],
    });
    expect(next).toBeDefined();
    expect(next!.mlSchema?.definition).toHaveProperty("isbnStore");
    expect(next!.uuid).toBe(bookEntity.uuid);
  });

  it("applyEntityOnlyRename renames Entity without needing EntityVersion", () => {
    const next = applyEntityOnlyRename(bookEntity, "Volume");
    expect(next).toBeDefined();
    expect(next!.name).toBe("Volume");
  });

  it("applyEntityOnlyAlterAttribute returns undefined for incomplete Entity", () => {
    const incomplete = {
      uuid: bookEntity.uuid,
      name: bookEntity.name,
      parentUuid: bookEntity.parentUuid,
    } as Entity;
    expect(applyEntityOnlyAlterAttribute(incomplete, { removeColumns: ["year"] })).toBeUndefined();
  });
});
