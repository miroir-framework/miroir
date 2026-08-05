/**
 * #227 Phase 2 — QueryVersion in freeze plan.
 */
import { describe, expect, it } from "vitest";

import {
  APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID,
  buildFreezeApplicationVersionPlan,
  type StoredQueryForFreeze,
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

function makeQuery(uuid: string, name: string): StoredQueryForFreeze {
  return {
    uuid,
    name,
    definition: {
      runtimeTransformers: {
        main: { transformerType: "returnValue", value: [] },
      },
    },
  };
}

function sequentialUuid() {
  let n = 0;
  return () => {
    n += 1;
    return `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
  };
}

describe("227 Phase 2 — QueryVersion freeze plan", () => {
  it("assembles QueryVersions + Cross rows alongside Entity freeze", () => {
    const entities = [makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book")];
    const storedQueries = [
      makeQuery("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "BookCount"),
      makeQuery("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "AuthorList"),
    ];
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V-with-queries",
      entities,
      storedQueries,
      newUuid: sequentialUuid(),
    });

    expect(plan.entityVersions).toHaveLength(1);
    expect(plan.queryVersions).toHaveLength(2);
    expect(plan.crossQueryVersions).toHaveLength(2);

    const qvUuids = new Set(plan.queryVersions.map((qv) => qv.uuid));
    expect(qvUuids.size).toBe(2);
    for (const qv of plan.queryVersions) {
      expect(qv.uuid).not.toBe(qv.queryUuid);
      expect(storedQueries.map((q) => q.uuid)).toContain(qv.queryUuid);
    }

    for (const cross of plan.crossQueryVersions) {
      expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
      expect(qvUuids.has(cross.queryVersion)).toBe(true);
      expect(cross.parentUuid).toBe(APPLICATION_VERSION_CROSS_QUERY_VERSION_UUID);
      expect(cross.parentName).toBe("ApplicationVersionCrossQueryVersion");
    }
  });

  it("omits QueryVersion rows when storedQueries is empty", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V-no-queries",
      entities: [makeEntity("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "Author")],
      storedQueries: [],
      newUuid: sequentialUuid(),
    });
    expect(plan.queryVersions).toEqual([]);
    expect(plan.crossQueryVersions).toEqual([]);
  });
});
