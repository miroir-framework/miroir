import { describe, expect, it } from "vitest";

import {
  entityEntity,
  entityDefinitionEntity,
} from "miroir-test-app_deployment-miroir";
import { defaultLibraryAppModel } from "miroir-test-app_deployment-library";

import type {
  Entity,
  EntityVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  entityMLSchema,
  entityWithResolvedMLSchema,
} from "../../src/0_interfaces/1_core/EntityVersion.js";
import { alignEntityDefinitionToPresentEntity } from "../../src/1_core/entityPresentModel.js";

describe("217 Phase 4 — entityMLSchema / entityWithResolvedMLSchema", () => {
  it("resolves Entity.mlSchema extending entityDefinitionRoot", () => {
    const entity = entityEntity as Entity;
    const resolved = entityMLSchema(entity);
    expect(resolved.type).toBe("object");
    expect(resolved.definition).toHaveProperty("name");
    expect(resolved.definition).toHaveProperty("mlSchema");
    // root identity fields come from entityDefinitionRoot extend
    expect(resolved.definition).toHaveProperty("uuid");
    expect(resolved.definition).toHaveProperty("parentUuid");
  });

  it("returns Entity with inlined resolved mlSchema", () => {
    const entity = entityEntity as Entity;
    const withResolved = entityWithResolvedMLSchema(entity);
    expect(withResolved.uuid).toBe(entity.uuid);
    expect(withResolved.mlSchema?.extend).toBeUndefined();
    expect(withResolved.mlSchema?.definition).toHaveProperty("uuid");
    expect(withResolved.mlSchema?.definition).toHaveProperty("mlSchema");
  });

  it("throws when Entity has no mlSchema", () => {
    const incomplete: Entity = {
      uuid: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "Incomplete",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    };
    expect(() => entityMLSchema(incomplete)).toThrow(/mlSchema/);
  });
});

describe("217 Phase 4 — alignEntityDefinitionToPresentEntity", () => {
  it("projects Entity definition fields onto the redundant EntityVersion", () => {
    const book = defaultLibraryAppModel.entities.find(
      (e) => e.uuid === "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    )!;
    const bookDefinition = defaultLibraryAppModel.entityVersions.find(
      (d) => d.entityUuid === book.uuid,
    )!;
    const aligned = alignEntityDefinitionToPresentEntity(book, bookDefinition);
    expect(aligned.uuid).toBe(bookDefinition.uuid);
    expect(aligned.entityUuid).toBe(book.uuid);
    expect(aligned.mlSchema).toEqual(book.mlSchema);
    expect(aligned.viewAttributes).toEqual(book.viewAttributes);
    expect(aligned.cache).toEqual(book.cache);
    expect(aligned.defaultInstanceDetailsReportUuid).toBe(
      book.defaultInstanceDetailsReportUuid,
    );
  });

  it("uses Entity-authoritative fields when they diverge from EntityVersion", () => {
    const entity = {
      ...(entityEntity as Entity),
      viewAttributes: ["onlyOnEntity"],
    };
    const aligned = alignEntityDefinitionToPresentEntity(
      entity,
      entityDefinitionEntity as EntityVersion,
    );
    expect(aligned.viewAttributes).toEqual(["onlyOnEntity"]);
    expect(aligned.uuid).toBe((entityDefinitionEntity as EntityVersion).uuid);
  });
});
