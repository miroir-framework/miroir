/**
 * #216 Phase 1.2 — snapshotEntitiesAsHistoricalEntityVersions.
 */
import { describe, expect, it } from "vitest";

import {
  snapshotEntitiesAsHistoricalEntityVersions,
} from "../../src/1_core/applicationVersionFreeze.js";
import {
  projectEntityPresentModelDefinition,
} from "../../src/1_core/entityPresentModel.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

function makeEntity(uuid: string, name: string, extra?: Partial<Entity>): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
    ...extra,
  };
}

describe("216 Phase 1 — snapshotEntitiesAsHistoricalEntityVersions", () => {
  const deterministic = (() => {
    let counter = 0;
    return () => `eeeeeeee-eeee-4eee-8eee-${String(++counter).padStart(12, "0")}`;
  })();

  it("produces EntityVersion with new UUID ≠ Entity.uuid", () => {
    const entity = makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book");
    const [ev] = snapshotEntitiesAsHistoricalEntityVersions([entity], { newUuid: deterministic });
    expect(ev.uuid).not.toBe(entity.uuid);
  });

  it("sets entityUuid to live Entity.uuid", () => {
    const entity = makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Author");
    const [ev] = snapshotEntitiesAsHistoricalEntityVersions([entity], { newUuid: deterministic });
    expect(ev.entityUuid).toBe(entity.uuid);
  });

  it("sets parentUuid/parentName to EntityVersion entity", () => {
    const entity = makeEntity("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Country");
    const [ev] = snapshotEntitiesAsHistoricalEntityVersions([entity], { newUuid: deterministic });
    expect(ev.parentUuid).toBe("54b9c72f-d4f3-4db9-9e0e-0dc840b530bd");
    expect(ev.parentName).toBe("EntityVersion");
  });

  it("§11.3: projectEntityPresentModelDefinition(ev) == projectEntityPresentModelDefinition(entity)", () => {
    const entity = makeEntity("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "Publisher", {
      viewAttributes: ["title", "author"],
      cache: { cacheAllInstancesOnRefresh: true },
      idAttribute: "code",
    });
    const [ev] = snapshotEntitiesAsHistoricalEntityVersions([entity], { newUuid: deterministic });
    expect(projectEntityPresentModelDefinition(ev)).toEqual(
      projectEntityPresentModelDefinition(entity),
    );
  });

  it("copies name from Entity", () => {
    const entity = makeEntity("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "LendingItem");
    const [ev] = snapshotEntitiesAsHistoricalEntityVersions([entity], { newUuid: deterministic });
    expect(ev.name).toBe("LendingItem");
  });

  it("deep isolation: mutating source Entity.mlSchema after snapshot does not affect historical copy", () => {
    const entity = makeEntity("ffffffff-ffff-4fff-8fff-ffffffffffff", "Mutable");
    const [ev] = snapshotEntitiesAsHistoricalEntityVersions([entity], { newUuid: deterministic });
    (entity.mlSchema as any).definition.newField = { type: "number" };
    expect((ev.mlSchema as any).definition.newField).toBeUndefined();
  });

  it("empty entity list produces empty result", () => {
    const result = snapshotEntitiesAsHistoricalEntityVersions([]);
    expect(result).toEqual([]);
  });

  it("throws on Entity without mlSchema", () => {
    const incomplete: Entity = {
      uuid: "11111111-1111-4111-8111-111111111111",
      name: "Incomplete",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      parentName: "Entity",
    };
    expect(() => snapshotEntitiesAsHistoricalEntityVersions([incomplete])).toThrow(/mlSchema/);
  });
});
