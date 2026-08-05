/**
 * #227 Phase 2 — RunnerVersion in freeze plan.
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
    return `dddddddd-dddd-4ddd-8ddd-${String(n).padStart(12, "0")}`;
  };
}

describe("227 Phase 2 — RunnerVersion freeze plan", () => {
  it("assembles RunnerVersions + Cross rows alongside Entity freeze", () => {
    const runners = [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "returnDocument",
        application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        defaultLabel: "Return Document",
        definition: {
          runnerType: "actionRunner",
          endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
          action: "returnDocument",
        },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "lendDocument",
        application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        defaultLabel: "Lend Document",
        definition: {
          runnerType: "actionRunner",
          endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
          action: "lendDocument",
        },
      },
    ];
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-Runners",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      runners,
      newUuid: sequentialUuid(),
    });

    expect(plan.runnerVersions).toHaveLength(2);
    expect(plan.crossRunnerVersions).toHaveLength(2);
    const rvUuids = new Set(plan.runnerVersions.map((rv) => rv.uuid));
    expect(rvUuids.size).toBe(2);
    for (const cross of plan.crossRunnerVersions) {
      expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
      expect(rvUuids.has(cross.runnerVersion)).toBe(true);
    }
  });

  it("omits RunnerVersion rows when runners is empty", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-NoRunners",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      runners: [],
      newUuid: sequentialUuid(),
    });
    expect(plan.runnerVersions).toEqual([]);
    expect(plan.crossRunnerVersions).toEqual([]);
  });
});
