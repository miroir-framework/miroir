/**
 * #216 Phase 4 — Option A Entity-set diff → modelCUDMigration candidates.
 */
import { describe, expect, it } from "vitest";

import {
  buildFreezeApplicationVersionPlan,
  diffEntityVersionSnapshots,
  snapshotEntitiesAsHistoricalEntityVersions,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type {
  Entity,
  EntityVersion,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";

const BOOK = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const AUTHOR = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const PUBLISHER = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function makeEntity(
  uuid: string,
  name: string,
  mlSchema?: Entity["mlSchema"],
): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: mlSchema ?? {
      type: "object",
      definition: { title: { type: "string" } },
    },
  };
}

function sequentialUuid(start = 0) {
  let n = start;
  return () => {
    n += 1;
    return `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
  };
}

function snap(entities: Entity[], start = 0): EntityVersion[] {
  return snapshotEntitiesAsHistoricalEntityVersions(entities, {
    newUuid: sequentialUuid(start),
  });
}

describe("216 Phase 4 — diffEntityVersionSnapshots", () => {
  it("returns [] for identical projections", () => {
    const entities = [makeEntity(BOOK, "Book"), makeEntity(AUTHOR, "Author")];
    const previous = snap(entities, 0);
    const next = snap(entities, 100);
    expect(diffEntityVersionSnapshots(previous, next)).toEqual([]);
  });

  it("emits createEntity when Entity only in next", () => {
    const previous = snap([makeEntity(BOOK, "Book")], 0);
    const next = snap(
      [makeEntity(BOOK, "Book"), makeEntity(AUTHOR, "Author")],
      100,
    );
    expect(diffEntityVersionSnapshots(previous, next)).toEqual([
      { kind: "createEntity", entityUuid: AUTHOR, name: "Author" },
    ]);
  });

  it("emits dropEntity when Entity only in previous", () => {
    const previous = snap(
      [makeEntity(BOOK, "Book"), makeEntity(AUTHOR, "Author")],
      0,
    );
    const next = snap([makeEntity(BOOK, "Book")], 100);
    expect(diffEntityVersionSnapshots(previous, next)).toEqual([
      { kind: "dropEntity", entityUuid: AUTHOR, name: "Author" },
    ]);
  });

  it("emits renameEntity when same entityUuid has different name", () => {
    const previous = snap([makeEntity(BOOK, "Book")], 0);
    const next = snap([makeEntity(BOOK, "Tome")], 100);
    expect(diffEntityVersionSnapshots(previous, next)).toEqual([
      {
        kind: "renameEntity",
        entityUuid: BOOK,
        name: "Book",
        targetName: "Tome",
      },
    ]);
  });

  it("emits alterEntityAttribute when mlSchema changes", () => {
    const previous = snap([makeEntity(BOOK, "Book")], 0);
    const next = snap(
      [
        makeEntity(BOOK, "Book", {
          type: "object",
          definition: {
            title: { type: "string" },
            pages: { type: "number" },
          },
        }),
      ],
      100,
    );
    const candidates = diffEntityVersionSnapshots(previous, next);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      kind: "alterEntityAttribute",
      entityUuid: BOOK,
      name: "Book",
    });
    expect(candidates[0].kind === "alterEntityAttribute" && candidates[0].differingFields).toContain(
      "mlSchema",
    );
  });

  it("emits alterEntityAttribute when a present-model definition field changes", () => {
    const prevEntities = [makeEntity(BOOK, "Book")];
    const previous = snap(prevEntities, 0);
    previous[0] = {
      ...previous[0],
      viewAttributes: ["title"],
    };
    const next = snap(prevEntities, 100);
    next[0] = {
      ...next[0],
      viewAttributes: ["title", "pages"],
    };
    const candidates = diffEntityVersionSnapshots(previous, next);
    expect(candidates).toEqual([
      {
        kind: "alterEntityAttribute",
        entityUuid: BOOK,
        name: "Book",
        differingFields: ["viewAttributes"],
      },
    ]);
  });

  it("can emit renameEntity and alterEntityAttribute for the same entity", () => {
    const previous = snap([makeEntity(BOOK, "Book")], 0);
    const next = snap(
      [
        makeEntity(BOOK, "Tome", {
          type: "object",
          definition: { isbn: { type: "string" } },
        }),
      ],
      100,
    );
    const kinds = diffEntityVersionSnapshots(previous, next).map((c) => c.kind);
    expect(kinds).toEqual(["renameEntity", "alterEntityAttribute"]);
  });

  it("emits mixed create/drop/rename in a stable order", () => {
    const previous = snap(
      [makeEntity(BOOK, "Book"), makeEntity(AUTHOR, "Author")],
      0,
    );
    const next = snap(
      [makeEntity(BOOK, "Tome"), makeEntity(PUBLISHER, "Publisher")],
      100,
    );
    expect(diffEntityVersionSnapshots(previous, next)).toEqual([
      { kind: "createEntity", entityUuid: PUBLISHER, name: "Publisher" },
      { kind: "dropEntity", entityUuid: AUTHOR, name: "Author" },
      {
        kind: "renameEntity",
        entityUuid: BOOK,
        name: "Book",
        targetName: "Tome",
      },
    ]);
  });
});

describe("216 Phase 4 — plan attaches diff on second freeze", () => {
  it("first freeze leaves modelCUDMigration empty", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities: [makeEntity(BOOK, "Book")],
      newUuid: sequentialUuid(0),
    });
    expect(plan.selfApplicationVersion.modelCUDMigration).toEqual([]);
  });

  it("second freeze fills modelCUDMigration from previousEntityVersions", () => {
    const first = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities: [makeEntity(BOOK, "Book")],
      newUuid: sequentialUuid(0),
    });

    const second = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V2",
      entities: [
        makeEntity(BOOK, "Book"),
        makeEntity(AUTHOR, "Author"),
      ],
      existingApplicationVersions: [first.selfApplicationVersion],
      freezeProducedVersionUuids: [first.selfApplicationVersion.uuid],
      previousEntityVersions: first.entityVersions,
      newUuid: sequentialUuid(100),
    });

    expect(second.selfApplicationVersion.previousVersion).toBe(
      first.selfApplicationVersion.uuid,
    );
    expect(second.selfApplicationVersion.modelCUDMigration).toEqual([
      { kind: "createEntity", entityUuid: AUTHOR, name: "Author" },
    ]);
  });

  it("second freeze with identical entities yields empty modelCUDMigration", () => {
    const entities = [makeEntity(BOOK, "Book")];
    const first = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities,
      newUuid: sequentialUuid(0),
    });
    const second = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V2",
      entities,
      existingApplicationVersions: [first.selfApplicationVersion],
      freezeProducedVersionUuids: [first.selfApplicationVersion.uuid],
      previousEntityVersions: first.entityVersions,
      newUuid: sequentialUuid(100),
    });
    expect(second.selfApplicationVersion.modelCUDMigration).toEqual([]);
  });
});
