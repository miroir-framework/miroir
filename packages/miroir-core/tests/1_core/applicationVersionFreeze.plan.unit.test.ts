/**
 * #216 Phase 2 — buildFreezeApplicationVersionPlan / planFreezeApplicationVersion.
 */
import { describe, expect, it } from "vitest";

import {
  buildFreezeApplicationVersionPlan,
  planFreezeApplicationVersion,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

function sequentialUuid() {
  let n = 0;
  return () => {
    n += 1;
    return `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
  };
}

describe("216 Phase 2 — first freeze plan", () => {
  it("assembles SAV + EntityVersions + Cross without previousVersion", () => {
    const entities = [
      makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book"),
      makeEntity("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Author"),
    ];
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities,
      newUuid: sequentialUuid(),
    });

    expect(plan.selfApplicationVersion.name).toBe("V1");
    expect(plan.selfApplicationVersion.selfApplication).toBe(APP_UUID);
    expect(plan.selfApplicationVersion.branch).toBe(BRANCH_UUID);
    expect(plan.selfApplicationVersion.previousVersion).toBeUndefined();
    expect(plan.selfApplicationVersion.modelCUDMigration).toEqual([]);
    expect(plan.selfApplicationVersion.parentUuid).toBe(
      "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
    );
    expect(plan.selfApplicationVersion.parentName).toBe("ApplicationVersion");

    expect(plan.entityVersions).toHaveLength(2);
    const snapshotUuids = new Set(plan.entityVersions.map((ev) => ev.uuid));
    expect(snapshotUuids.size).toBe(2);
    for (const ev of plan.entityVersions) {
      expect(ev.uuid).not.toBe(ev.entityUuid);
    }
    expect(plan.entityVersions.map((ev) => ev.entityUuid).sort()).toEqual(
      entities.map((e) => e.uuid).sort(),
    );

    expect(plan.crossEntityVersions).toHaveLength(2);
    for (const cross of plan.crossEntityVersions) {
      expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
      expect(snapshotUuids.has(cross.entityVersion)).toBe(true);
      expect(entities.map((e) => e.uuid)).not.toContain(cross.entityVersion);
      expect(cross.parentUuid).toBe("8bec933d-6287-4de7-8a88-5c24216de9f4");
      expect(cross.parentName).toBe("ApplicationVersionCrossEntityVersion");
    }
    const coveredLive = plan.entityVersions.map((ev) => ev.entityUuid).sort();
    expect(coveredLive).toEqual(entities.map((e) => e.uuid).sort());
  });

  it("rejects duplicate versionName for same app+branch", () => {
    expect(() =>
      buildFreezeApplicationVersionPlan({
        selfApplicationUuid: APP_UUID,
        branchUuid: BRANCH_UUID,
        versionName: "V1",
        entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
        existingApplicationVersions: [
          {
            uuid: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
            name: "V1",
            selfApplication: APP_UUID,
            branch: BRANCH_UUID,
          },
        ],
      }),
    ).toThrow(/already exists/);
  });

  it("allows same versionName on a different branch", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
      existingApplicationVersions: [
        {
          uuid: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
          name: "V1",
          selfApplication: APP_UUID,
          branch: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        },
      ],
      newUuid: sequentialUuid(),
    });
    expect(plan.selfApplicationVersion.name).toBe("V1");
  });
});

describe("216 Phase 2 — planFreezeApplicationVersion gate wrapper", () => {
  it("rejects unversioned selfApplication", () => {
    expect(() =>
      planFreezeApplicationVersion({
        selfApplication: { versioningEnabled: false },
        selfApplicationUuid: APP_UUID,
        branchUuid: BRANCH_UUID,
        versionName: "V1",
        entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
      }),
    ).toThrow(/versioning enabled/);
  });

  it("builds plan when versioningEnabled is true", () => {
    const plan = planFreezeApplicationVersion({
      selfApplication: { versioningEnabled: true },
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities: [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")],
      newUuid: sequentialUuid(),
    });
    expect(plan.selfApplicationVersion.name).toBe("V1");
    expect(plan.entityVersions).toHaveLength(1);
    expect(plan.crossEntityVersions).toHaveLength(1);
  });
});
