import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityDefinition,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  applyAlterEntityAttributePair,
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
const bookDefinition = defaultLibraryAppModel.entityDefinitions.find(
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
  it("keeps Entity authoritative and aligns EntityDefinition for complete Entity", () => {
    const pair = normalizeCreateEntityPair(bookEntity, bookDefinition);
    expect(pair.entity).toBe(bookEntity);
    expect(compareEntityPresentModelDefinitions(pair.entity, pair.entityDefinition).equal).toBe(
      true,
    );
    expect(pair.entityDefinition.uuid).toBe(bookDefinition.uuid);
  });

  it("enriches legacy incomplete Entity from EntityDefinition then dual-writes", () => {
    const legacyEntity: Entity = {
      uuid: bookEntity.uuid,
      name: bookEntity.name,
      parentUuid: bookEntity.parentUuid,
      parentName: bookEntity.parentName,
      description: bookEntity.description,
    };
    const pair = normalizeCreateEntityPair(legacyEntity, bookDefinition);
    expect(pair.entity.mlSchema).toEqual(bookDefinition.mlSchema);
    expect(compareEntityPresentModelDefinitions(pair.entity, pair.entityDefinition).equal).toBe(
      true,
    );
  });

  it("prefers Entity definition fields over diverging EntityDefinition on create", () => {
    const entity: Entity = {
      ...bookEntity,
      viewAttributes: ["titleOnly"],
    };
    const pair = normalizeCreateEntityPair(entity, bookDefinition);
    expect(pair.entity.viewAttributes).toEqual(["titleOnly"]);
    expect(pair.entityDefinition.viewAttributes).toEqual(["titleOnly"]);
  });
});

describe("217 Phase 5 — applyAlterEntityAttributePair", () => {
  it("updates Entity.mlSchema and dual-writes EntityDefinition", () => {
    const pair = applyAlterEntityAttributePair(bookEntity, bookDefinition, {
      addColumns: [{ name: "isbn", definition: { type: "string" } }],
    });
    expect(pair.entity.mlSchema?.definition).toHaveProperty("isbn");
    expect(pair.entityDefinition.mlSchema.definition).toHaveProperty("isbn");
    expect(compareEntityPresentModelDefinitions(pair.entity, pair.entityDefinition).equal).toBe(
      true,
    );
  });

  it("removes columns from both Entity and EntityDefinition", () => {
    const pair = applyAlterEntityAttributePair(bookEntity, bookDefinition, {
      removeColumns: ["year"],
    });
    expect(pair.entity.mlSchema?.definition).not.toHaveProperty("year");
    expect(pair.entityDefinition.mlSchema.definition).not.toHaveProperty("year");
  });
});

describe("217 Phase 5 — applyRenameEntityPair", () => {
  it("renames Entity and aligned EntityDefinition together", () => {
    const pair = applyRenameEntityPair(bookEntity, bookDefinition, "Tome");
    expect(pair.entity.name).toBe("Tome");
    expect(pair.entityDefinition.name).toBe("Tome");
    expect(
      projectEntityPresentModelDefinition(pair.entity).mlSchema,
    ).toEqual(projectEntityPresentModelDefinition(pair.entityDefinition).mlSchema);
  });
});
