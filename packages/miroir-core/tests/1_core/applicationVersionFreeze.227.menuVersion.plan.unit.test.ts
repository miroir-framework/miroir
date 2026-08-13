/**
 * #227 Phase 2 — MenuVersion in freeze plan.
 */
import { describe, expect, it } from "vitest";

import { buildFreezeApplicationVersionPlan } from "../../src/1_core/versioning/applicationVersionFreeze.js";
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
    return `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`;
  };
}

describe("227 Phase 2 — MenuVersion freeze plan", () => {
  it("assembles MenuVersions + Cross rows alongside Entity freeze", () => {
    const menus = [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "LibraryMenu",
        defaultLabel: "Library Menu",
        definition: { menuType: "simpleMenu", definition: [] },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "AltMenu",
        definition: { menuType: "complexMenu", definition: [] },
      },
    ];
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-Menus",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      menus,
      newUuid: sequentialUuid(),
    });

    expect(plan.menuVersions).toHaveLength(2);
    expect(plan.crossMenuVersions).toHaveLength(2);
    const mvUuids = new Set(plan.menuVersions.map((mv) => mv.uuid));
    expect(mvUuids.size).toBe(2);
    for (const cross of plan.crossMenuVersions) {
      expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
      expect(mvUuids.has(cross.menuVersion)).toBe(true);
    }
  });

  it("omits MenuVersion rows when menus is empty", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-NoMenus",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      menus: [],
      newUuid: sequentialUuid(),
    });
    expect(plan.menuVersions).toEqual([]);
    expect(plan.crossMenuVersions).toEqual([]);
  });
});
